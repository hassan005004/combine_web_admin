<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Domain extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'entry_type',
        'url',
        'google_play_url',
        'app_store_url',
        'application_id',
        'cache_ttl_hours',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'privacy_policy',
        'terms_conditions',
        'support_policy',
        'about_us',
        'ads_settings',
        'primary_color',
        'secondary_color',
        'app_version',
        'min_build_code',
        'force_update',
    ];

    protected $casts = [
        'ads_settings' => 'array',
        'force_update' => 'boolean',
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

    public function memberships()
    {
        return $this->hasMany(AppMembership::class);
    }

    public function membershipFeatures()
    {
        return $this->hasMany(MembershipFeature::class);
    }

    public function membershipPlans()
    {
        return $this->hasMany(MembershipPlan::class);
    }
}
