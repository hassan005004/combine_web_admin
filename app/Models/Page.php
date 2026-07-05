<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'title',
        'slug',
        'description',
        'status',
    ];

    // Relationships
    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }
}
