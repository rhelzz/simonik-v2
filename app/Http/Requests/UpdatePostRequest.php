<?php

namespace App\Http\Requests;

/**
 * Aturan ubah identik dengan aturan buat — mengikuti pola
 * UpdateIndustryRequest & UpdateAnnouncementRequest yang sudah ada.
 *
 * Siapa yang boleh mengubah ditentukan PostPolicy::update(), bukan di sini.
 */
class UpdatePostRequest extends StorePostRequest {}
