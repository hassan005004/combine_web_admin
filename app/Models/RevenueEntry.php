<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RevenueEntry extends Model
{
    protected $fillable = ['domain_id', 'source', 'amount', 'currency', 'description', 'date'];
    protected $casts    = ['amount' => 'decimal:2', 'date' => 'date'];

    public function domain() { return $this->belongsTo(Domain::class); }
}
