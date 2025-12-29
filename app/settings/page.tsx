
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { Key, Bot, Search, Save, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState({
        googleApiKey: '',
        hasApiKey: false,
        preferences: {
            preferredModel: 'gemini-2.5-flash',
            enableGoogleSearch: true,
            systemPrompt: ''
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/user/settings');
            if (!response.ok) throw new Error('Failed to fetch settings');
            const data = await response.json();
            setSettings({
                googleApiKey: data.hasApiKey ? '••••••••' : '',
                hasApiKey: data.hasApiKey,
                preferences: {
                    preferredModel: data.preferences?.preferredModel || 'gemini-2.5-flash',
                    enableGoogleSearch: data.preferences?.enableGoogleSearch !== undefined ? data.preferences.enableGoogleSearch : true,
                    systemPrompt: data.preferences?.systemPrompt || ''
                }
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (!response.ok) throw new Error('Failed to save settings');

            toast.success('Settings saved successfully');
            setSettings(prev => ({
                ...prev,
                hasApiKey: settings.googleApiKey !== '' && settings.googleApiKey !== '••••••••',
                googleApiKey: (settings.googleApiKey || prev.hasApiKey) ? '••••••••' : ''
            }));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const clearApiKey = () => {
        setSettings(prev => ({ ...prev, googleApiKey: '', hasApiKey: false }));
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner />
        </div>
    );

    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                    <Bot className="h-10 w-10 text-blue-600" />
                    AI & System Settings
                </h1>
                <p className="text-gray-500 text-lg">
                    Personalize your activity discovery and secure your API credentials.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* API Key Section */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden ring-1 ring-gray-200">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b pb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-600 rounded-lg">
                                        <Key className="h-5 w-5 text-white" />
                                    </div>
                                    <CardTitle>Google AI Credentials</CardTitle>
                                </div>
                                {settings.hasApiKey && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Encrypted & Secure
                                    </div>
                                )}
                            </div>
                            <CardDescription className="mt-2">
                                Save your Google Gemini API Key. It will be encrypted before storage and used ONLY for your requests.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="apiKey" className="text-base font-semibold">Gemini API Key</Label>
                                    <a
                                        href="https://aistudio.google.com/app/apikey"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline font-medium"
                                    >
                                        Get a Free Key →
                                    </a>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            id="apiKey"
                                            type="password"
                                            value={settings.googleApiKey}
                                            onChange={(e) => setSettings({ ...settings, googleApiKey: e.target.value })}
                                            placeholder="Enter your sk-..."
                                            className="pr-10 h-12 text-lg border-gray-200 focus:ring-blue-500"
                                        />
                                        {settings.hasApiKey && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>
                                    {settings.hasApiKey && (
                                        <Button
                                            variant="outline"
                                            onClick={clearApiKey}
                                            className="h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 italic">
                                    Tip: Keys are saved behind a master encryption layer. We never store them in plain text.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Model Preferences */}
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden ring-1 ring-gray-200">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b pb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-600 rounded-lg">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                                <CardTitle>AI Preferences</CardTitle>
                            </div>
                            <CardDescription className="mt-2">
                                Fine-tune how the AI behaves during chat and discovery.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">Preferred Gemini Model</Label>
                                    <Select
                                        value={settings.preferences.preferredModel}
                                        onValueChange={(val) => setSettings({
                                            ...settings,
                                            preferences: { ...settings.preferences, preferredModel: val }
                                        })}
                                    >
                                        <SelectTrigger className="h-12 border-gray-200">
                                            <SelectValue placeholder="Select a model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Balanced)</SelectItem>
                                            <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Powerful)</SelectItem>
                                            <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Fast)</SelectItem>
                                            <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Minimal Costs)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-400">Flash models are recommended for daily use.</p>
                                </div>

                                <div className="flex flex-col space-y-3">
                                    <Label className="text-base font-semibold">Google Search Integration</Label>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <Search className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-medium">Enable Live Search</span>
                                        </div>
                                        <Switch
                                            checked={settings.preferences.enableGoogleSearch}
                                            onCheckedChange={(val) => setSettings({
                                                ...settings,
                                                preferences: { ...settings.preferences, enableGoogleSearch: val }
                                            })}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">Allows AI to find REAL events and verify times/links.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar / Info */}
                <div className="space-y-6">
                    <Card className="bg-blue-600 text-white border-none shadow-xl overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-bold text-xl">Cloud Sync</h3>
                            <p className="text-blue-100 text-sm leading-relaxed">
                                Your credentials are now "Portable". You can log in from any device and your AI features will work seamlessly without needing environment variables.
                            </p>
                            <div className="pt-2 border-t border-blue-500/30 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-xs font-medium text-blue-200 uppercase tracking-wider">System Active</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-3 shadow-sm">
                        <h4 className="font-semibold text-orange-800 flex items-center gap-2 text-sm">
                            <ShieldCheck className="h-4 w-4" />
                            Developer Security Note
                        </h4>
                        <p className="text-xs text-orange-700/80 leading-relaxed">
                            We use AES-256 encryption with a server-side salt. Your raw key is processed in memory only during the AI request and is never logged or exposed.
                        </p>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full h-14 text-lg font-bold shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 transition-all active:scale-[0.98]"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <LoadingSpinner /> Saving...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Save className="h-5 w-5" /> Update All Settings
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
