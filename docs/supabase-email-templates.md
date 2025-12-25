# Supabase Email Templates for Velvet Family Salon

Copy each HTML template below into the corresponding Supabase email template section.

> ✅ **Logo is already configured!**
> 
> Your logo URL: `https://kdwrappztdwovobauhou.supabase.co/storage/v1/object/public/service-images/Gemini_Generated_Image_j404t4j404t4j404.png`

---

## 1. Confirm Sign Up

**Subject:** `Confirm your email - Velvet Family Salon`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fdf8f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdf8f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #c9a4a8 0%, #d4a5a5 100%); padding: 30px; text-align: center;">
              <img src="https://kdwrappztdwovobauhou.supabase.co/storage/v1/object/public/service-images/Gemini_Generated_Image_j404t4j404t4j404.png" alt="Velvet Family Salon" width="80" height="80" style="border-radius: 12px; margin-bottom: 15px; border: 3px solid rgba(255,255,255,0.3);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 3px;">VELVET</h1>
              <p style="margin: 5px 0 0; color: #ffffff; font-size: 12px; letter-spacing: 2px;">FAMILY SALON</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #2d2d2d; font-size: 24px; font-weight: 500;">Welcome to Velvet! ✨</h2>
              <p style="margin: 0 0 25px; color: #666666; font-size: 16px; line-height: 1.6;">
                Thank you for joining our admin team. Please confirm your email address to activate your account.
              </p>
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #c9a4a8 0%, #b8858a 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 30px; font-size: 16px; font-weight: 500; letter-spacing: 0.5px;">
                Confirm Email
              </a>
              <p style="margin: 30px 0 0; color: #999999; font-size: 13px;">
                This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f4f2; padding: 25px 30px; text-align: center;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 12px;">
                <strong>Velvet Family Salon</strong><br>
                Shivamogga, Karnataka, India
              </p>
              <p style="margin: 0 0 10px; color: #999999; font-size: 11px;">
                This is an automated message from our admin portal.<br>
                Please do not reply to this email.
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                © 2024 Velvet Family Salon. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Invite User

**Subject:** `You're invited to Velvet Family Salon Admin`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fdf8f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdf8f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #c9a4a8 0%, #d4a5a5 100%); padding: 30px; text-align: center;">
              <img src="https://kdwrappztdwovobauhou.supabase.co/storage/v1/object/public/service-images/Gemini_Generated_Image_j404t4j404t4j404.png" alt="Velvet Family Salon" width="80" height="80" style="border-radius: 12px; margin-bottom: 15px; border: 3px solid rgba(255,255,255,0.3);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 3px;">VELVET</h1>
              <p style="margin: 5px 0 0; color: #ffffff; font-size: 12px; letter-spacing: 2px;">FAMILY SALON</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #2d2d2d; font-size: 24px; font-weight: 500;">You're Invited! 🎉</h2>
              <p style="margin: 0 0 25px; color: #666666; font-size: 16px; line-height: 1.6;">
                You've been invited to join the <strong>Velvet Family Salon</strong> admin team. Click below to set up your account.
              </p>
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #c9a4a8 0%, #b8858a 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 30px; font-size: 16px; font-weight: 500; letter-spacing: 0.5px;">
                Accept Invitation
              </a>
              <p style="margin: 30px 0 0; color: #999999; font-size: 13px;">
                This invitation expires in 24 hours. Contact your administrator if you have questions.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f4f2; padding: 25px 30px; text-align: center;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 12px;">
                <strong>Velvet Family Salon</strong><br>
                Shivamogga, Karnataka, India
              </p>
              <p style="margin: 0 0 10px; color: #999999; font-size: 11px;">
                This is an automated message from our admin portal.<br>
                Please do not reply to this email.
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                © 2024 Velvet Family Salon. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Magic Link

**Subject:** `Your login link - Velvet Family Salon`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Magic Link Login</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fdf8f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdf8f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #c9a4a8 0%, #d4a5a5 100%); padding: 30px; text-align: center;">
              <img src="https://kdwrappztdwovobauhou.supabase.co/storage/v1/object/public/service-images/Gemini_Generated_Image_j404t4j404t4j404.png" alt="Velvet Family Salon" width="80" height="80" style="border-radius: 12px; margin-bottom: 15px; border: 3px solid rgba(255,255,255,0.3);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 3px;">VELVET</h1>
              <p style="margin: 5px 0 0; color: #ffffff; font-size: 12px; letter-spacing: 2px;">FAMILY SALON</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #2d2d2d; font-size: 24px; font-weight: 500;">Your Login Link 🔐</h2>
              <p style="margin: 0 0 25px; color: #666666; font-size: 16px; line-height: 1.6;">
                Click the button below to securely sign in to your account. No password needed!
              </p>
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #c9a4a8 0%, #b8858a 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 30px; font-size: 16px; font-weight: 500; letter-spacing: 0.5px;">
                Sign In Now
              </a>
              <p style="margin: 30px 0 0; color: #999999; font-size: 13px;">
                This link expires in 1 hour. If you didn't request this, please ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f4f2; padding: 25px 30px; text-align: center;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 12px;">
                <strong>Velvet Family Salon</strong><br>
                Shivamogga, Karnataka, India
              </p>
              <p style="margin: 0 0 10px; color: #999999; font-size: 11px;">
                This is an automated message from our admin portal.<br>
                Please do not reply to this email.
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                © 2024 Velvet Family Salon. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Change Email Address

**Subject:** `Confirm your new email - Velvet Family Salon`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fdf8f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdf8f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #c9a4a8 0%, #d4a5a5 100%); padding: 30px; text-align: center;">
              <img src="https://kdwrappztdwovobauhou.supabase.co/storage/v1/object/public/service-images/Gemini_Generated_Image_j404t4j404t4j404.png" alt="Velvet Family Salon" width="80" height="80" style="border-radius: 12px; margin-bottom: 15px; border: 3px solid rgba(255,255,255,0.3);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 3px;">VELVET</h1>
              <p style="margin: 5px 0 0; color: #ffffff; font-size: 12px; letter-spacing: 2px;">FAMILY SALON</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #2d2d2d; font-size: 24px; font-weight: 500;">Confirm Email Change 📧</h2>
              <p style="margin: 0 0 25px; color: #666666; font-size: 16px; line-height: 1.6;">
                You requested to change your email address. Please confirm this is your new email by clicking below.
              </p>
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #c9a4a8 0%, #b8858a 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 30px; font-size: 16px; font-weight: 500; letter-spacing: 0.5px;">
                Confirm New Email
              </a>
              <p style="margin: 30px 0 0; color: #999999; font-size: 13px;">
                If you didn't request this change, please contact us immediately.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f4f2; padding: 25px 30px; text-align: center;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 12px;">
                <strong>Velvet Family Salon</strong><br>
                Shivamogga, Karnataka, India
              </p>
              <p style="margin: 0 0 10px; color: #999999; font-size: 11px;">
                This is an automated message from our admin portal.<br>
                Please do not reply to this email.
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                © 2024 Velvet Family Salon. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 5. Reset Password

**Subject:** `Reset your password - Velvet Family Salon`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fdf8f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdf8f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #c9a4a8 0%, #d4a5a5 100%); padding: 30px; text-align: center;">
              <img src="https://kdwrappztdwovobauhou.supabase.co/storage/v1/object/public/service-images/Gemini_Generated_Image_j404t4j404t4j404.png" alt="Velvet Family Salon" width="80" height="80" style="border-radius: 12px; margin-bottom: 15px; border: 3px solid rgba(255,255,255,0.3);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 3px;">VELVET</h1>
              <p style="margin: 5px 0 0; color: #ffffff; font-size: 12px; letter-spacing: 2px;">FAMILY SALON</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #2d2d2d; font-size: 24px; font-weight: 500;">Reset Your Password 🔑</h2>
              <p style="margin: 0 0 25px; color: #666666; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #c9a4a8 0%, #b8858a 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 30px; font-size: 16px; font-weight: 500; letter-spacing: 0.5px;">
                Reset Password
              </a>
              <p style="margin: 30px 0 0; color: #999999; font-size: 13px;">
                This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f4f2; padding: 25px 30px; text-align: center;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 12px;">
                <strong>Velvet Family Salon</strong><br>
                Shivamogga, Karnataka, India
              </p>
              <p style="margin: 0 0 10px; color: #999999; font-size: 11px;">
                This is an automated message from our admin portal.<br>
                Please do not reply to this email.
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                © 2024 Velvet Family Salon. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 6. Reauthentication

**Subject:** `Verify your identity - Velvet Family Salon`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Identity</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fdf8f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdf8f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #c9a4a8 0%, #d4a5a5 100%); padding: 30px; text-align: center;">
              <img src="https://kdwrappztdwovobauhou.supabase.co/storage/v1/object/public/service-images/Gemini_Generated_Image_j404t4j404t4j404.png" alt="Velvet Family Salon" width="80" height="80" style="border-radius: 12px; margin-bottom: 15px; border: 3px solid rgba(255,255,255,0.3);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 3px;">VELVET</h1>
              <p style="margin: 5px 0 0; color: #ffffff; font-size: 12px; letter-spacing: 2px;">FAMILY SALON</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #2d2d2d; font-size: 24px; font-weight: 500;">Verify Your Identity 🛡️</h2>
              <p style="margin: 0 0 25px; color: #666666; font-size: 16px; line-height: 1.6;">
                For security purposes, please verify your identity to continue with your request.
              </p>
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #c9a4a8 0%, #b8858a 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 30px; font-size: 16px; font-weight: 500; letter-spacing: 0.5px;">
                Verify Identity
              </a>
              <p style="margin: 30px 0 0; color: #999999; font-size: 13px;">
                If you didn't initiate this action, please secure your account immediately.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f4f2; padding: 25px 30px; text-align: center;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 12px;">
                <strong>Velvet Family Salon</strong><br>
                Shivamogga, Karnataka, India
              </p>
              <p style="margin: 0 0 10px; color: #999999; font-size: 11px;">
                This is an automated message from our admin portal.<br>
                Please do not reply to this email.
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                © 2024 Velvet Family Salon. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## How to Apply These Templates

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. For each template type, copy the HTML from above
3. Paste into the **Message** field
4. Update the **Subject** field with the provided subject
5. Click **Save**
