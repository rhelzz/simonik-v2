<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evaluations', function (Blueprint $table): void {
            $table->string('technical_label')->nullable()->after('aspek_produktif_id');
            $table->unsignedTinyInteger('score')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('evaluations', function (Blueprint $table): void {
            $table->dropColumn('technical_label');
            $table->unsignedTinyInteger('score')->nullable(false)->change();
        });
    }
};
