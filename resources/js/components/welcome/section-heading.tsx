export function SectionHeading({
    eyebrow,
    title,
    desc,
    align = 'center',
}: {
    eyebrow?: string;
    title: string;
    desc?: string;
    align?: 'center' | 'left';
}) {
    const isCenter = align === 'center';

    return (
        <div className={isCenter ? 'text-center' : 'max-w-2xl'}>
            {eyebrow && (
                <span
                    className={`inline-flex items-center gap-2 text-xs font-bold tracking-widest text-accent uppercase ${isCenter ? 'justify-center' : ''}`}
                >
                    <span className="h-px w-6 bg-accent/50" />
                    {eyebrow}
                </span>
            )}
            <h2
                className={`text-3xl font-extrabold tracking-tight text-balance text-ink sm:text-4xl ${eyebrow ? 'mt-4' : ''}`}
            >
                {title}
            </h2>
            {desc && (
                <p
                    className={`mt-4 text-base leading-relaxed text-muted ${isCenter ? 'mx-auto max-w-2xl' : ''}`}
                >
                    {desc}
                </p>
            )}
        </div>
    );
}
