<?php

namespace App\Http\Controllers;

use App\Http\Requests\AbsenceRequest;
use App\Http\Requests\CheckInRequest;
use App\Http\Requests\CheckOutRequest;
use App\Models\Approval;
use App\Models\Attendance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    /**
     * Halaman absen siswa: status hari ini + riwayat. Semua dibatasi ke akun siswa.
     */
    public function index(Request $request): Response
    {
        $userId = (int) $request->user()->id;
        $today = $this->todayRecord($userId);

        $history = Attendance::query()
            ->with('approval')
            ->where('user_id', $userId)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(10)
            ->through(fn (Attendance $attendance): array => $this->present($attendance));

        $student = $request->user()->students;
        $industry = $student?->industries;

        return Inertia::render('attendance/index', [
            'today' => $today ? $this->present($today) : null,
            'history' => $history,
            'todayLabel' => Carbon::today()->translatedFormat('l, d F Y'),
            'industry' => $industry ? [
                'name' => $industry->name,
                'jam_masuk' => $industry->jam_masuk ? substr($industry->jam_masuk, 0, 5) : null,
                'jam_pulang' => $industry->jam_pulang ? substr($industry->jam_pulang, 0, 5) : null,
            ] : null,
        ]);
    }

    /**
     * Absen masuk (foto + geolokasi). Sekali per hari.
     */
    public function checkIn(CheckInRequest $request): RedirectResponse
    {
        $userId = (int) $request->user()->id;

        if ($this->todayRecord($userId) !== null) {
            return back()->with('error', 'Anda sudah melakukan absen hari ini.');
        }

        $validated = $request->validated();
        $mode = $validated['mode'] ?? 'wfo';

        // Heuristic 1: Tolak gps_accuracy di atas 100 meter (ambang)
        $gpsAccuracy = (float) $validated['gps_accuracy'];
        if ($gpsAccuracy > 100) {
            return back()->withErrors([
                'latitude' => 'Akurasi GPS terlalu rendah ('.round($gpsAccuracy).'m). Pastikan GPS Anda aktif dan berada di ruang terbuka.',
            ])->with('error', 'Absen ditolak: Akurasi GPS tidak memadai.');
        }

        $student = $request->user()->students;
        $industry = $student?->industries;
        $isLate = false;
        $isSuspect = false;
        $distanceM = null;

        // Heuristic 2: Tandai is_suspect jika akurasi GPS buruk (> 50m)
        if ($gpsAccuracy > 50) {
            $isSuspect = true;
        }

        if ($industry && $industry->latitude && $industry->longitude) {
            $distanceM = (int) $this->calculateDistance(
                (float) $industry->latitude,
                (float) $industry->longitude,
                (float) $validated['latitude'],
                (float) $validated['longitude']
            );

            // Validasi Geofencing: Tolak jika di luar radius (hanya jika mode WFO)
            if ($mode === 'wfo' && $distanceM > $industry->radius) {
                return back()->withErrors([
                    'latitude' => 'Anda berada di luar radius industri ('.$distanceM.'m dari target, radius maksimal: '.$industry->radius.'m).',
                ])->with('error', 'Absen ditolak: Anda berada di luar radius industri.');
            }
        }

        if ($industry && $industry->jam_masuk) {
            $currentTime = Carbon::now()->format('H:i:s');
            if ($currentTime > $industry->jam_masuk) {
                $isLate = true;
            }
        }

        // Heuristic 3: Lompatan tak wajar (unnatural leap)
        $lastAttendance = Attendance::where('user_id', $userId)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->first();

        if ($lastAttendance && $lastAttendance->latitude && $lastAttendance->longitude) {
            $leapDistance = $this->calculateDistance(
                (float) $lastAttendance->latitude,
                (float) $lastAttendance->longitude,
                (float) $validated['latitude'],
                (float) $validated['longitude']
            );
            $hours = $lastAttendance->created_at ? $lastAttendance->created_at->diffInHours(Carbon::now()) : 24;
            if ($hours < 12 && $leapDistance > 100000) { // > 100km dalam < 12 jam
                $isSuspect = true;
            }
        }

        $path = $request->file('image')->store('attendances', 'public');

        $attendance = Attendance::create([
            'user_id' => $userId,
            'date' => Carbon::today(),
            'arrivalTime' => Carbon::now()->format('H:i:s'),
            'status' => 'hadir',
            'is_late' => $isLate,
            'is_suspect' => $isSuspect,
            'distance_m' => $distanceM,
            'gps_accuracy' => $gpsAccuracy,
            'mode' => $mode,
            'image' => $path,
            'emotion' => $validated['emotion'] ?? null,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'description' => $validated['description'] ?? null,
        ]);

        if ($mode === 'wfa') {
            Approval::initiate($attendance);
        }

        return back()->with('success', 'Absen masuk berhasil direkam.');
    }

    /**
     * Detail satu record absen milik siswa yang sedang login.
     */
    public function show(Request $request, Attendance $attendance): Response
    {
        if ($attendance->user_id !== (int) $request->user()->id) {
            abort(403);
        }

        $attendance->load('approval');

        return Inertia::render('attendance/show', [
            'attendance' => $this->present($attendance),
        ]);
    }

    /**
     * Absen pulang: melengkapi jam pulang + foto selfie.
     */
    public function checkOut(CheckOutRequest $request): RedirectResponse
    {
        $userId = (int) $request->user()->id;
        $today = $this->todayRecord($userId);

        if ($today === null || mb_strtolower((string) $today->status) !== 'hadir') {
            return back()->with('error', 'Belum ada absen masuk hari ini.');
        }

        if ($today->departureTime !== null) {
            return back()->with('error', 'Anda sudah absen pulang hari ini.');
        }

        $validated = $request->validated();

        // Heuristic 1: Tolak gps_accuracy di atas 100 meter (ambang)
        $gpsAccuracy = (float) $validated['gps_accuracy'];
        if ($gpsAccuracy > 100) {
            return back()->withErrors([
                'latitude' => 'Akurasi GPS terlalu rendah ('.round($gpsAccuracy).'m). Pastikan GPS Anda aktif dan berada di ruang terbuka.',
            ])->with('error', 'Absen pulang ditolak: Akurasi GPS tidak memadai.');
        }

        $student = $request->user()->students;
        $industry = $student?->industries;
        $isSuspect = $today->is_suspect;

        // Heuristic 2: Tandai is_suspect jika akurasi GPS buruk (> 50m)
        if ($gpsAccuracy > 50) {
            $isSuspect = true;
        }

        if ($industry && $industry->latitude && $industry->longitude) {
            $distanceM = (int) $this->calculateDistance(
                (float) $industry->latitude,
                (float) $industry->longitude,
                (float) $validated['latitude'],
                (float) $validated['longitude']
            );

            // Validasi Geofencing: Tolak jika di luar radius (mode WFO)
            if ($today->mode === 'wfo' && $distanceM > $industry->radius) {
                return back()->withErrors([
                    'latitude' => 'Anda berada di luar radius industri ('.$distanceM.'m dari target, radius maksimal: '.$industry->radius.'m).',
                ])->with('error', 'Absen pulang ditolak: Anda berada di luar radius industri.');
            }
        }

        // Heuristic 3: Lompatan tak wajar (unnatural leap)
        if ($today->latitude && $today->longitude) {
            $leapDistance = $this->calculateDistance(
                (float) $today->latitude,
                (float) $today->longitude,
                (float) $validated['latitude'],
                (float) $validated['longitude']
            );
            if ($leapDistance > 100000) { // Lebih dari 100km saat checkout vs checkin
                $isSuspect = true;
            }
        }

        $path = $request->file('image')->store('attendances', 'public');

        $today->update([
            'departureTime' => Carbon::now()->format('H:i:s'),
            'departure_image' => $path,
            'departure_emotion' => $validated['emotion'] ?? null,
            'is_suspect' => $isSuspect,
        ]);

        return back()->with('success', 'Absen pulang berhasil direkam.');
    }

    /**
     * Pengajuan izin / sakit untuk hari ini.
     */
    public function absence(AbsenceRequest $request): RedirectResponse
    {
        $userId = (int) $request->user()->id;

        if ($this->todayRecord($userId) !== null) {
            return back()->with('error', 'Anda sudah mengisi absen hari ini.');
        }

        $validated = $request->validated();
        $path = $request->hasFile('image')
            ? $request->file('image')->store('attendances', 'public')
            : null;

        Attendance::create([
            'user_id' => $userId,
            'date' => Carbon::today(),
            'status' => $validated['status'],
            'absenceReason' => $validated['absenceReason'],
            'image' => $path,
        ]);

        return back()->with('success', 'Pengajuan izin/sakit berhasil direkam.');
    }

    /**
     * Record absen siswa untuk hari ini (jika ada).
     */
    private function todayRecord(int $userId): ?Attendance
    {
        return Attendance::query()
            ->with('approval')
            ->where('user_id', $userId)
            ->whereDate('date', Carbon::today())
            ->first();
    }

    /**
     * Bentuk data absen untuk dikirim ke halaman Inertia.
     *
     * @return array<string, mixed>
     */
    private function present(Attendance $attendance): array
    {
        return [
            'id' => $attendance->id,
            'date' => $attendance->date->format('Y-m-d'),
            'dateLabel' => $attendance->date->translatedFormat('l, d F Y'),
            'status' => $attendance->status,
            'arrivalTime' => $attendance->arrivalTime ? mb_substr($attendance->arrivalTime, 0, 5) : null,
            'departureTime' => $attendance->departureTime ? mb_substr($attendance->departureTime, 0, 5) : null,
            'isLate' => $attendance->is_late,
            'isSuspect' => $attendance->is_suspect,
            'mode' => $attendance->mode,
            'approval' => $attendance->approval ? [
                'id' => $attendance->approval->id,
                'status' => $attendance->approval->status,
                'note' => $attendance->approval->note,
            ] : null,
            'absenceReason' => $attendance->absenceReason,
            'image' => $attendance->image,
            'emotion' => $attendance->emotion,
            'departureImage' => $attendance->departure_image,
            'departureEmotion' => $attendance->departure_emotion,
            'latitude' => $attendance->latitude,
            'longitude' => $attendance->longitude,
            'description' => $attendance->description,
        ];
    }

    /**
     * Hitung jarak Haversine antara dua koordinat dalam meter.
     */
    private function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000; // dalam meter

        $latFrom = deg2rad($lat1);
        $lonFrom = deg2rad($lng1);
        $latTo = deg2rad($lat2);
        $lonTo = deg2rad($lng2);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));

        return $angle * $earthRadius;
    }
}
