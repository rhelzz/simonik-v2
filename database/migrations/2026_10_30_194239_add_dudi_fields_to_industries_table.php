<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('industries', function (Blueprint $table) {
            $table->string('nib')->nullable()->after('name');
            $table->string('rt', 10)->nullable()->after('alamat');
            $table->string('rw', 10)->nullable()->after('rt');
            $table->string('dusun')->nullable()->after('rw');
            $table->string('kelurahan')->nullable()->after('dusun');
            $table->string('kecamatan')->nullable()->after('kelurahan');
            $table->string('kode_pos', 10)->nullable()->after('kecamatan');
            $table->string('email')->nullable()->after('duration');
            $table->string('website')->nullable()->after('email');
            $table->string('npwp')->nullable()->after('website');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('industries', function (Blueprint $table) {
            $table->dropColumn([
                'nib',
                'rt',
                'rw',
                'dusun',
                'kelurahan',
                'kecamatan',
                'kode_pos',
                'email',
                'website',
                'npwp',
            ]);
        });
    }
};
