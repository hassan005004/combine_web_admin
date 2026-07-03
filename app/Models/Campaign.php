<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    protected $fillable = [
        'domain_id', 'name', 'type', 'status', 'subject',
        'body', 'scheduled_at', 'sent_at', 'sent_count', 'open_count', 'click_count',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at'      => 'datetime',
    ];

    public function domain() { return $this->belongsTo(Domain::class); }
}
