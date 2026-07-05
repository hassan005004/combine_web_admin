<?php

namespace App\Http\Controllers;

class AdminReactController extends Controller
{
    public function __invoke()
    {
        return view('admin.react');
    }
}
