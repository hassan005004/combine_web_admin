<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoleEntry extends Model
{
    protected $fillable = ['role_id', 'domain_id'];

    public function role()   { return $this->belongsTo(Role::class); }
    public function domain() { return $this->belongsTo(Domain::class); }
}
