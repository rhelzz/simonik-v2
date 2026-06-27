export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
};

export type Role =
    | 'admin'
    | 'kaprog'
    | 'guru'
    | 'pembimbing'
    | 'siswa'
    | 'orangtua'
    | 'industri'
    | 'mitra'
    | 'kepala_sekolah';

export type Auth = {
    user: User | null;
    roles: Role[];
};
