import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

// This API route uses the Service Role key to create users
// It should only be accessible by super_admins

export async function POST(request: NextRequest) {
    try {
        const { email, name, role } = await request.json();

        // Validate input
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        if (!['admin', 'staff'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // Check if the requesting user is a super_admin
        const supabase = await createServerClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: adminData } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', currentUser.id)
            .single();

        if (!adminData || adminData.role !== 'super_admin') {
            return NextResponse.json({ error: 'Only super admins can invite users' }, { status: 403 });
        }

        // Create admin client with service role for user creation
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!serviceRoleKey || !supabaseUrl) {
            return NextResponse.json({
                error: 'Server configuration error: Service role key not configured'
            }, { status: 500 });
        }

        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Check if user already exists
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);

        if (existingUser) {
            // User exists in auth, check if they're in admin_users
            const { data: existingAdmin } = await supabase
                .from('admin_users')
                .select('id')
                .eq('email', email)
                .single();

            if (existingAdmin) {
                return NextResponse.json({ error: 'User already has admin access' }, { status: 400 });
            }

            // Add existing user to admin_users
            const { error: insertError } = await supabase
                .from('admin_users')
                .insert({
                    user_id: existingUser.id,
                    email: email,
                    name: name || null,
                    role: role,
                    created_by: currentUser.id,
                });

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: 'User added to admin panel'
            });
        }

        // Use Supabase's built-in invite email (uses noreply@mail.app.supabase.io)
        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/reset-password`,
        });

        if (inviteError) {
            console.error('Invite error:', inviteError);
            return NextResponse.json({ error: inviteError.message }, { status: 500 });
        }

        if (!inviteData.user) {
            return NextResponse.json({ error: 'Failed to invite user' }, { status: 500 });
        }

        // Add to admin_users table
        const { error: insertError2 } = await supabase
            .from('admin_users')
            .insert({
                user_id: inviteData.user.id,
                email: email,
                name: name || null,
                role: role,
                created_by: currentUser.id,
            });

        if (insertError2) {
            // Try to clean up the created user
            await adminClient.auth.admin.deleteUser(inviteData.user.id);
            return NextResponse.json({ error: insertError2.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Invitation sent! User will receive an email to set their password.'
        });

    } catch (error) {
        console.error('Error inviting user:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('admin_users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ users: data });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}

// Update user permissions
export async function PATCH(request: NextRequest) {
    try {
        const { userId, permissions } = await request.json();

        if (!userId || !permissions) {
            return NextResponse.json({ error: 'User ID and permissions are required' }, { status: 400 });
        }

        // Check if the requesting user is a super_admin
        const supabase = await createServerClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: adminData } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', currentUser.id)
            .single();

        if (!adminData || adminData.role !== 'super_admin') {
            return NextResponse.json({ error: 'Only super admins can update permissions' }, { status: 403 });
        }

        // Don't allow modifying super_admin permissions
        const { data: targetUser } = await supabase
            .from('admin_users')
            .select('role')
            .eq('id', userId)
            .single();

        if (targetUser?.role === 'super_admin') {
            return NextResponse.json({ error: 'Cannot modify super admin permissions' }, { status: 403 });
        }

        // Update permissions
        const { error: updateError } = await supabase
            .from('admin_users')
            .update({ permissions })
            .eq('id', userId);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Permissions updated successfully'
        });

    } catch (error) {
        console.error('Error updating permissions:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}

// Delete user from both admin_users table and Supabase Auth
export async function DELETE(request: NextRequest) {
    try {
        const { userId, authUserId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Check if the requesting user is a super_admin
        const supabase = await createServerClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: adminData } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', currentUser.id)
            .single();

        if (!adminData || adminData.role !== 'super_admin') {
            return NextResponse.json({ error: 'Only super admins can delete users' }, { status: 403 });
        }

        // Don't allow deleting super_admin
        const { data: targetUser } = await supabase
            .from('admin_users')
            .select('role, user_id')
            .eq('id', userId)
            .single();

        if (targetUser?.role === 'super_admin') {
            return NextResponse.json({ error: 'Cannot delete super admin' }, { status: 403 });
        }

        // Create admin client with service role
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!serviceRoleKey || !supabaseUrl) {
            return NextResponse.json({
                error: 'Server configuration error'
            }, { status: 500 });
        }

        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // Delete from admin_users table first
        const { error: deleteTableError } = await supabase
            .from('admin_users')
            .delete()
            .eq('id', userId);

        if (deleteTableError) {
            console.error('Error deleting from admin_users:', deleteTableError);
            return NextResponse.json({ error: deleteTableError.message }, { status: 500 });
        }

        // Delete from Supabase Auth using the auth user_id
        const authId = authUserId || targetUser?.user_id;
        if (authId) {
            const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(authId);
            if (deleteAuthError) {
                console.error('Error deleting from auth:', deleteAuthError);
                // User is already deleted from admin_users, log the auth error but don't fail
            }
        }

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}
