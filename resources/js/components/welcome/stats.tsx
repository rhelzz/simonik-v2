const stats = [
    { value: '1 layar', label: 'Semua data PKL terpusat' },
    { value: 'Real-time', label: 'Absensi & jurnal langsung terlihat' },
    { value: '4 peran', label: 'Sekolah, guru, siswa, industri' },
    { value: 'QR', label: 'Sertifikat terverifikasi digital' },
];

export function Stats() {
    return (
        <section className="reveal grid gap-6 rounded-3xl bg-surface p-6 shadow-sm shadow-primary/5 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line lg:p-8">
            {stats.map((stat, i) => (
                <div
                    key={stat.label}
                    className="group text-center transition-transform duration-300 hover:-translate-y-1 lg:px-6 lg:text-left lg:first:pl-0"
                >
                    <p
                        className={`text-3xl font-extrabold tracking-tight transition-transform duration-300 group-hover:scale-105 ${i % 2 === 1 ? 'text-accent' : 'text-primary'}`}
                    >
                        {stat.value}
                    </p>
                    <p className="mt-1.5 text-sm text-muted">{stat.label}</p>
                </div>
            ))}
        </section>
    );
}
