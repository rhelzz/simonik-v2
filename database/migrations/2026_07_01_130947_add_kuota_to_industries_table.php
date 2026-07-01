<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Kuota penerimaan siswa PKL per industri (null = tanpa batas).
     */
    public function up(): void
    {
        Schema::table('industries', function (Blueprint $table) {
            $table->unsignedInteger('kuota')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('industries', function (Blueprint $table) {
            $table->dropColumn('kuota');
        });
    }
};
