<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\RoutineFolder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RoutineFolderController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:80']]);
        auth()->user()->routineFolders()->create($data);

        return back()->with('success', 'Folder created.');
    }

    public function update(Request $request, RoutineFolder $folder): RedirectResponse
    {
        abort_unless((int) $folder->user_id === (int) auth()->id(), 403);
        $data = $request->validate(['name' => ['required', 'string', 'max:80']]);
        $folder->update($data);

        return back()->with('success', 'Folder renamed.');
    }

    public function destroy(RoutineFolder $folder): RedirectResponse
    {
        abort_unless((int) $folder->user_id === (int) auth()->id(), 403);
        $folder->delete();

        return back()->with('success', 'Folder deleted. Routines moved to ungrouped.');
    }
}
