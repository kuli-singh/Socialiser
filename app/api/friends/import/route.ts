
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import Papa from 'papaparse';

export const dynamic = "force-dynamic";

interface CSVRow {
  name: string;
  email?: string;
  group?: string;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  duplicates: Array<{
    row: number;
    name: string;
    reason: string;
  }>;
  importedFriends: Array<{
    name: string;
    email: string | null;
    group: string | null;
  }>;
}

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

function validateRow(row: any, rowIndex: number): { isValid: boolean; error?: string; data?: CSVRow } {
  if (!row.name || typeof row.name !== 'string' || row.name.trim() === '') {
    return { isValid: false, error: 'Name is required and cannot be empty' };
  }

  return {
    isValid: true,
    data: {
      name: row.name.trim(),
      email: row.email && typeof row.email === 'string' && row.email.trim() !== ''
        ? row.email.trim()
        : undefined,
      group: row.group && typeof row.group === 'string' && row.group.trim() !== ''
        ? row.group.trim()
        : undefined
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are allowed' }, { status: 400 });
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 });
    }

    const csvText = await file.text();

    // Parse CSV
    const parseResult = Papa.parse<CSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.toLowerCase().trim()
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json({
        error: 'CSV parsing failed',
        details: parseResult.errors.map(err => err.message)
      }, { status: 400 });
    }

    const result: ImportResult = {
      success: false,
      totalRows: parseResult.data.length,
      successfulImports: 0,
      errors: [],
      duplicates: [],
      importedFriends: []
    };

    if (result.totalRows === 0) {
      return NextResponse.json({ error: 'CSV file is empty or contains no valid data' }, { status: 400 });
    }

    // Get existing friends for duplicate checking
    const existingFriends = await prisma.friend.findMany({
      where: { userId: user.id },
      select: { name: true }
    });

    const existingNamesSet = new Set(existingFriends.map(f => f.name.toLowerCase()));
    const currentImportNames = new Set<string>();

    const validRows: Array<{ data: CSVRow; originalIndex: number }> = [];

    // Validate and check for duplicates
    parseResult.data.forEach((row, index) => {
      const validation = validateRow(row, index + 1);

      if (!validation.isValid) {
        result.errors.push({
          row: index + 1,
          data: row,
          error: validation.error!
        });
        return;
      }

      const validData = validation.data!;
      const normalizedName = validData.name.toLowerCase();

      // Check for duplicates with existing data
      if (existingNamesSet.has(normalizedName)) {
        result.duplicates.push({
          row: index + 1,
          name: validData.name,
          reason: 'Friend with this name already exists'
        });
        return;
      }

      // Check for duplicates within current import
      if (currentImportNames.has(normalizedName)) {
        result.duplicates.push({
          row: index + 1,
          name: validData.name,
          reason: 'Duplicate name within import file'
        });
        return;
      }

      // Add to tracking sets and valid rows
      currentImportNames.add(normalizedName);
      validRows.push({ data: validData, originalIndex: index + 1 });
    });

    // Import valid rows
    if (validRows.length > 0) {
      const importData = validRows.map(({ data }) => ({
        name: data.name,
        email: data.email || null, // Optional email field
        notes: "Imported contact",
        group: data.group || null,
        userId: user.id
      }));

      const importedFriends = await prisma.friend.createMany({
        data: importData
      });

      result.successfulImports = importedFriends.count;
      result.importedFriends = importData.map(({ name, email, group }) => ({ name, email, group }));
    }

    result.success = result.successfulImports > 0;

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error importing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV file' },
      { status: 500 }
    );
  }
}
