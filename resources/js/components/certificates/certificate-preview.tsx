import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PreviewAnchor = {
    text: string;
    x: number;
    y: number;
    size: number;
    align: 'left' | 'center' | 'right';
    color: string;
    font?: string;
};

export type PreviewSignature = {
    url: string;
    x: number;
    y: number;
    width: number;
};

/**
 * Render latar sertifikat + teks ter-anchor + TTD digital. Posisi x/y dalam
 * persen; ukuran teks dalam `cqw` (persen lebar) sehingga skalanya identik di
 * pratinjau editor maupun saat dicetak, berapa pun lebar wadahnya.
 */
export function CertificatePreview({
    background,
    items,
    signature,
    className,
}: {
    background: string | null;
    items: PreviewAnchor[];
    signature?: PreviewSignature | null;
    className?: string;
}) {
    if (!background) {
        return (
            <div
                className={cn(
                    'grid aspect-[1.414/1] w-full place-items-center rounded-xl border border-dashed border-line bg-canvas text-muted',
                    className,
                )}
            >
                <div className="flex flex-col items-center gap-1">
                    <ImageOff className="size-7" />
                    <p className="text-sm">Belum ada gambar latar</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('@container w-full', className)}>
            <div className="relative w-full overflow-hidden">
                <img
                    src={background}
                    alt="Latar sertifikat"
                    className="block w-full"
                />
                {items.map((item, index) => (
                    <span
                        key={index}
                        className="absolute leading-tight font-semibold whitespace-nowrap"
                        style={{
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            transform: `translate(${
                                item.align === 'center'
                                    ? '-50%'
                                    : item.align === 'right'
                                      ? '-100%'
                                      : '0'
                            }, -50%)`,
                            fontSize: `${item.size}cqw`,
                            color: item.color,
                            textAlign: item.align,
                            fontFamily: `'${item.font ?? 'Poppins'}', serif`,
                        }}
                    >
                        {item.text}
                    </span>
                ))}
                {signature && (
                    <img
                        src={signature.url}
                        alt="Tanda tangan"
                        className="absolute -translate-x-1/2 -translate-y-1/2 object-contain"
                        style={{
                            left: `${signature.x}%`,
                            top: `${signature.y}%`,
                            width: `${signature.width}%`,
                        }}
                    />
                )}
            </div>
        </div>
    );
}
