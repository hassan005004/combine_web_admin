<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntitySmtpSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'admin_email',
        'host',
        'port',
        'encryption',
        'username',
        'password',
        'from_email',
        'from_name',
        'is_active',
    ];

    protected $casts = [
        'password' => 'encrypted',
        'is_active' => 'boolean',
    ];

    protected $hidden = [
        'password',
    ];

    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }
}
