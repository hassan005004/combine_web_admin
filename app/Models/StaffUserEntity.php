<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffUserEntity extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'domain_id',
        'share_percent',
    ];

    protected $casts = [
        'share_percent' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }
}
