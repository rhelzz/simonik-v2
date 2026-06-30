<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('industries', function (Blueprint $table) {
            $table->unsignedInteger('radius')->default(100)->after('latitude');
            $table->time('jam_masuk')->nullable()->after('radius');
            $table->time('jam_pulang')->nullable()->after('jam_masuk');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->string('mode')->nullable()->after('status');
            $table->boolean('is_late')->default(false)->after('mode');
            $table->unsignedInteger('distance_m')->nullable()->after('is_late');
            $table->float('gps_accuracy')->nullable()->after('distance_m');
            $table->boolean('is_suspect')->default(false)->after('gps_accuracy');
        });
    }

    public function down(): void
    {
        Schema::table('industries', function (Blueprint $table) {
            $table->dropColumn(['radius', 'jam_masuk', 'jam_pulang']);
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['mode', 'is_late', 'distance_m', 'gps_accuracy', 'is_suspect']);
        });
    }
};
