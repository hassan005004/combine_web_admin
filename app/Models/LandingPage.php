<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingPage extends Model
{
    protected $fillable = [
        'domain_id', 'title', 'slug', 'headline', 'subheadline',
        'content', 'cta_text', 'cta_url', 'hero_image', 'status', 'view_count',
    ];

    public function domain() { return $this->belongsTo(Domain::class); }
}
