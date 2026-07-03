<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $table    = 'feedbacks';
    protected $fillable = ['domain_id', 'type', 'email', 'subject', 'body', 'status', 'admin_notes'];
    public function domain() { return $this->belongsTo(Domain::class); }
}
