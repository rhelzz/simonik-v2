<?php

namespace App\Services;

use App\Models\Student;
use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\URL;

/**
 * Membuat tautan verifikasi ber-signature dan QR code (SVG) yang menyandi tautan
 * tersebut. Dipakai untuk keaslian sertifikat (M4.1) dan rapor digital (M4.2).
 *
 * Memakai BaconQrCode (backend SVG) secara langsung: tidak butuh ekstensi
 * imagick/GD, hasilnya string SVG murni, dan tetap tajam saat dicetak (PDF).
 */
class QrCodeGenerator
{
    /**
     * Tautan publik ber-signature untuk memverifikasi keaslian PKL seorang siswa.
     * Tanpa kedaluwarsa — dokumen cetak berlaku permanen.
     */
    public function verificationUrl(Student $student): string
    {
        return URL::signedRoute('verification.show', ['student' => $student->id]);
    }

    /**
     * QR code (data-URI SVG) yang menyandi tautan verifikasi ber-signature.
     */
    public function verificationQr(Student $student, int $size = 150): string
    {
        $writer = new Writer(
            new ImageRenderer(
                new RendererStyle($size, 0),
                new SvgImageBackEnd,
            ),
        );

        $svg = $writer->writeString(
            $this->verificationUrl($student),
            ecLevel: ErrorCorrectionLevel::M(),
        );

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }
}
