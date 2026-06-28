<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pembimbing industri kini memakai entity `Pembimbing` (relasi `pembimbing_id`)
     * dan guru pembimbing ditempatkan di level industri (`teacher_id`, 1 guru → banyak PT).
     * Field teks mentor lama dibuang.
     */
    public function up(): void
    {
        Schema::table('industries', function (Blueprint $table) {
            $table->dropColumn(['industryMentorName', 'industryMentorNo']);
        });

        Schema::table('industries', function (Blueprint $table) {
            $table->foreignId('teacher_id')->nullable()->after('pembimbing_id')->constrained('teachers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('industries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('teacher_id');
        });

        Schema::table('industries', function (Blueprint $table) {
            $table->string('industryMentorName');
            $table->string('industryMentorNo');
        });
    }
};
