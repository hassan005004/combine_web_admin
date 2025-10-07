<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Domain extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'url',
        'application_id',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'primary_color',
        'secondary_color',
    ];

    // Relationships
    public function pages()
    {
        return $this->hasMany(Page::class);
    }

    public function faqs()
    {
        return $this->hasMany(Faq::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function userDevices()
    {
        return $this->hasMany(UserDevice::class);
    }
}
