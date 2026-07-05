<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeatureRequest extends Model
{
    protected $fillable = ['domain_id', 'email', 'title', 'description', 'status', 'votes', 'admin_notes'];
    public function domain() { return $this->belongsTo(Domain::class); }
}
