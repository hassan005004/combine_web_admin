<?php

namespace App\Services;

use App\Models\AppMembership;
use App\Models\Domain;
use App\Models\EntitySmtpSetting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EntitySmtpMailer
{
    public function test(EntitySmtpSetting $setting, ?string $toEmail = null): void
    {
        $this->send(
            $setting,
            $toEmail ?: $setting->admin_email,
            'SMTP test for '.$setting->domain->title,
            "SMTP test email sent successfully for {$setting->domain->title}."
        );
    }

    public function membershipChanged(Domain $domain, AppMembership $membership, string $action, array $extra = []): void
    {
        $setting = EntitySmtpSetting::where('domain_id', $domain->id)
            ->where('is_active', true)
            ->first();

        if (! $setting) {
            return;
        }

        try {
            $subject = "{$domain->title}: membership {$action}";
            $lines = [
                "Entity: {$domain->title}",
                "Application ID: ".($domain->application_id ?: '-'),
                "Action: {$action}",
                "Email: {$membership->email}",
                "Plan: {$membership->plan}",
                "Active: ".($membership->is_active ? 'Yes' : 'No'),
                "Expires at: ".($membership->expires_at?->toDateTimeString() ?: '-'),
                "Cancelled at: ".($membership->cancelled_at?->toDateTimeString() ?: '-'),
                "Cancellation source: ".($membership->cancellation_source ?: '-'),
                "Cancellation reason: ".($membership->cancellation_reason ?: '-'),
                "Cancellation details: ".($membership->cancellation_details ?: '-'),
            ];

            foreach ($extra as $label => $value) {
                $lines[] = "{$label}: ".($value ?: '-');
            }

            $this->send($setting, $setting->admin_email, $subject, implode("\n", $lines));
        } catch (\Throwable $error) {
            Log::warning('Entity SMTP membership notification failed.', [
                'domain_id' => $domain->id,
                'membership_id' => $membership->id,
                'action' => $action,
                'error' => $error->getMessage(),
            ]);
        }
    }

    private function send(EntitySmtpSetting $setting, string $toEmail, string $subject, string $body): void
    {
        $mailer = 'entity_smtp_'.$setting->id;

        config([
            "mail.mailers.{$mailer}" => [
                'transport' => 'smtp',
                'host' => $setting->host,
                'port' => $setting->port,
                'encryption' => $setting->encryption ?: null,
                'username' => $setting->username ?: null,
                'password' => $setting->password ?: null,
                'timeout' => 20,
                'local_domain' => config('mail.mailers.smtp.local_domain'),
            ],
        ]);

        Mail::purge($mailer);

        Mail::mailer($mailer)->raw($body, function ($message) use ($setting, $toEmail, $subject) {
            $message
                ->from($setting->from_email, $setting->from_name ?: $setting->domain->title)
                ->to($toEmail)
                ->subject($subject);
        });
    }
}
