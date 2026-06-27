<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string|null $google_id
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'google_id', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /** @return HasOne<Industry, $this> */
    public function industries(): HasOne
    {
        return $this->hasOne(Industry::class);
    }

    /** @return HasOne<Teacher, $this> */
    public function teachers(): HasOne
    {
        return $this->hasOne(Teacher::class);
    }

    /** @return HasOne<Parents, $this> */
    public function parents(): HasOne
    {
        return $this->hasOne(Parents::class);
    }

    /** @return HasOne<Student, $this> */
    public function students(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    /** @return HasOne<Pembimbing, $this> */
    public function pembimbing(): HasOne
    {
        return $this->hasOne(Pembimbing::class);
    }

    /** @return HasOne<Guide, $this> */
    public function guides(): HasOne
    {
        return $this->hasOne(Guide::class);
    }

    /** @return HasMany<Visits, $this> */
    public function visits(): HasMany
    {
        return $this->hasMany(Visits::class);
    }

    /** @return HasMany<Attendance, $this> */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /** @return HasMany<Activity, $this> */
    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    /** @return HasMany<Schedule, $this> */
    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    /** @return HasMany<Departemen, $this> */
    public function departements(): HasMany
    {
        return $this->hasMany(Departemen::class);
    }

    /** @return HasMany<Post, $this> */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /** @return HasMany<Comment, $this> */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }
}
