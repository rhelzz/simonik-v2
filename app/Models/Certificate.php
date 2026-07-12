<?php

namespace App\Models;

use Database\Factories\CertificateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Satu sertifikat yang ditugaskan ke siswa memakai template tertentu. Seorang
 * siswa dapat memiliki banyak baris (mis. sertifikat sekolah + industri).
 *
 * @property int $id
 * @property int $student_id
 * @property int|null $certificate_template_id
 * @property string $certificate_id
 * @property string|null $title
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read CertificateTemplate|null $certificateTemplate
 */
#[Fillable(['student_id', 'certificate_template_id', 'certificate_id', 'title'])]
class Certificate extends Model
{
    /** @use HasFactory<CertificateFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Certificate $certificate): void {
            $certificate->certificate_id ??= 'CERT/'.now()->year.'/'.strtoupper(Str::random(8));
        });
    }

    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /** @return BelongsTo<CertificateTemplate, $this> */
    public function certificateTemplate(): BelongsTo
    {
        return $this->belongsTo(CertificateTemplate::class);
    }
}
