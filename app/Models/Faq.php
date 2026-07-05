<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'slug',
        'question',
        'answer',
        'sorting',
    ];

    // Relationships
    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }
}
