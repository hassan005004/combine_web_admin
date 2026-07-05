<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntryNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'user_id',
        'title',
        'body',
        'visibility',
    ];

    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
