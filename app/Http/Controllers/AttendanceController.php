<?php

namespace App\Http\Controllers;

use App\Http\Requests\AbsenceRequest;
use App\Http\Requests\CheckInRequest;
use App\Http\Requests\CheckOutRequest;
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
            ->where('user_id', $userId)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(10)
            ->through(fn (Attendance $attendance): array => $this->present($attendance));

        return Inertia::render('attendance/index', [
            'today' => $today ? $this->present($today) : null,
            'history' => $history,
            'todayLabel' => Carbon::today()->translatedFormat('l, d F Y'),
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
        $path = $request->file('image')->store('attendances', 'public');

        Attendance::create([
            'user_id' => $userId,
            'date' => Carbon::today(),
            'arrivalTime' => Carbon::now()->format('H:i:s'),
            'status' => 'hadir',
            'image' => $path,
            'emotion' => $validated['emotion'] ?? null,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'description' => $validated['description'] ?? null,
        ]);

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

        $path = $request->file('image')->store('attendances', 'public');

        $validated = $request->validated();

        $today->update([
            'departureTime' => Carbon::now()->format('H:i:s'),
            'departure_image' => $path,
            'departure_emotion' => $validated['emotion'] ?? null,
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
}
