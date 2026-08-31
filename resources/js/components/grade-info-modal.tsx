import { Modal } from '@/components/ui/modal';
import { gradeRanges, gradeStyles, qualificationLabels } from '@/lib/grade';
import { cn } from '@/lib/utils';

export function GradeInfoModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    return (
        <Modal open={open} onClose={onClose} title="Informasi grade">
            <div className="space-y-3">
                <p className="text-sm text-muted">
                    Kategori ini berlaku untuk aspek Teknis dan Non-Teknis.
                </p>
                {gradeRanges.map(({ grade, range }) => (
                    <div
                        key={grade}
                        className="flex items-center gap-3 rounded-xl border border-line bg-canvas/40 p-3"
                    >
                        <span
                            className={cn(
                                'inline-flex size-9 items-center justify-center rounded-xl text-sm font-bold',
                                gradeStyles[grade],
                            )}
                        >
                            {grade}
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-ink">
                                {range}
                            </p>
                            <p className="text-xs text-muted">
                                {qualificationLabels[grade]}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </Modal>
    );
}
