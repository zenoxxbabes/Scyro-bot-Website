import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: "No file received." }, { status: 400 });
        }

        // Server-side validation for JPG/PNG
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: "Only JPG and PNG images are allowed." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;

        // Robustly determine the correct public/uploads directory
        let uploadDir;
        const cwd = process.cwd();

        // Check if we are in the root and 'dashboard' exists
        if (!cwd.endsWith('dashboard') && !cwd.endsWith('dashboard\\') && !cwd.endsWith('dashboard/')) {
            const dashboardUploads = join(cwd, 'dashboard', 'public', 'uploads');
            // We assume if we are not in dashboard, we are likely in project root
            uploadDir = dashboardUploads;
        } else {
            // We are likely in dashboard directory
            uploadDir = join(cwd, 'public', 'uploads');
        }

        // Create the directory
        await mkdir(uploadDir, { recursive: true });

        const path = join(uploadDir, filename);
        await writeFile(path, buffer);

        // Return the public URL
        const url = `/uploads/${filename}`;
        return NextResponse.json({ url, success: true });

    } catch (e) {
        console.error("Upload error:", e);
        return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }
}
