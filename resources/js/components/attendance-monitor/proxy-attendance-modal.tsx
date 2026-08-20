import { useForm } from '@inertiajs/react';
import { UserCheck, X } from 'lucide-react';
import { storeProxy } from '@/actions/App/Http/Controllers/AttendanceMonitorController';
import { Modal } from '@/components/ui/modal';
import type { RosterRow } from './daily-roster';

type Props = {
    open: boolean;
    onClose: () => void;
    students: RosterRow[];
    /** Tanggal aktif di panel roster — presensi dicatat untuk tanggal ini. */
    date: string;
    dateLabel: string;
    onDeselect: (id: number) => void;
    onDone: () => void;
};

/**
 * Presensi diwakilkan: pilih murid + satu waktu, tanpa geolokasi & foto.
 *
 * Murid yang sudah punya data absen dilewati di server (bukan ditimpa), jadi
 * modal ini tidak perlu mengecek ulang — daftarnya memang berasal dari tab
 * "Belum".
 */
export function ProxyAttendanceModal({
    open,
    onClose,
    students,
    date,
    dateLabel,
    onDeselect,
    onDone,
}: Props) {
    const form = useForm({
        student_ids: [] as number[],
        date,
        arrival_time: '08:00',
    });

    function submit(event: React.FormEvent) {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            date,
            student_ids: students.map((student) => student.id),
        }));

        form.post(storeProxy.url(), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('arrival_time');
                onDone();
            },
        });
    }

    return (
        <Modal open={open} onClose={onClose} title="Presensikan murid">
            <form onSubmit={submit} className="space-y-4">
                <p className="text-sm text-muted">
                    Presensi dicatat untuk <strong>{dateLabel}</strong> tanpa
                    geolokasi dan foto, serta ditandai sebagai presensi yang
                    diwakilkan.
                </p>

                <div>
                    <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                        Murid terpilih ({students.length})
                    </p>
                    <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
                        {students.map((student) => (
                            <li
                                key={student.id}
                                className="flex items-center justify-between gap-2 rounded-xl bg-canvas px-3 py-2"
                            >
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-ink">
                                        {student.name}
                                    </span>
                                    <span className="block truncate text-xs text-muted">
                                        {student.nis}
                                        {student.class
                                            ? ` · ${student.class}`
                                            : ''}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onDeselect(student.id)}
                                    title={`Batalkan ${student.name}`}
                                    className="grid size-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink"
                                >
                                    <X className="size-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <label className="block">
                    <span className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                        Jam masuk
                    </span>
                    <input
                        type="time"
                        value={form.data.arrival_time}
                        onChange={(event) =>
                            form.setData('arrival_time', event.target.value)
                        }
                        required
                        className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
                    />
                    {form.errors.arrival_time && (
                        <span className="mt-1 block text-xs font-medium text-red-500">
                            {form.errors.arrival_time}
                        </span>
                    )}
                </label>

                {form.errors.student_ids && (
                    <p className="text-xs font-medium text-red-500">
                        {form.errors.student_ids}
                    </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={form.processing || students.length === 0}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                    >
                        <UserCheck className="size-4" />
                        Presensikan {students.length} murid
                    </button>
                </div>
            </form>
        </Modal>
    );
}
