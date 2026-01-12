
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
    const [isAdmin, setIsAdmin] = useState(false);
    const [settings, setSettings] = useState({
        name: '',
        googleApiKey: '',
        hasApiKey: false,
        preferences: {
            preferredModel: 'gemini-2.5-flash',
            enableGoogleSearch: true,
            systemPrompt: '',
            defaultLocation: '',
            socialLocation: ''
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings', { cache: 'no-store' });
            if (!response.ok) throw new Error('Failed to fetch settings');
            const data = await response.json();

            setIsAdmin(data.isAdmin || false);

            setSettings({
                name: data.name || '',
                googleApiKey: data.hasApiKey ? '••••••••' : '',
                hasApiKey: data.hasApiKey,
                preferences: {
                    preferredModel: data.preferredModel || 'gemini-2.5-flash',
                    enableGoogleSearch: data.enableGoogleSearch !== undefined ? data.enableGoogleSearch : true,
                    systemPrompt: data.systemPrompt || '',
                    defaultLocation: data.defaultLocation || '',
                    socialLocation: data.socialLocation || ''
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
            // Prepare payload: Flatten struct and handle masked API Key
            const payload: any = {
                name: settings.name,
                ...settings.preferences
            };

            // Only include API Key if it's been changed (not the masked placeholder)
            if (settings.googleApiKey && settings.googleApiKey !== '••••••••') {
                payload.googleApiKey = settings.googleApiKey;
            }

            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to save settings');
            const data = await response.json();

            toast.success('Settings saved successfully');

            // Update state with returned data
            setSettings({
                name: data.name || '',
                googleApiKey: data.hasApiKey ? '••••••••' : '',
                hasApiKey: data.hasApiKey,
                preferences: {
                    preferredModel: data.preferredModel || settings.preferences.preferredModel,
                    enableGoogleSearch: data.enableGoogleSearch !== undefined ? data.enableGoogleSearch : settings.preferences.enableGoogleSearch,
                    systemPrompt: data.systemPrompt || settings.preferences.systemPrompt,
                    defaultLocation: data.defaultLocation || settings.preferences.defaultLocation,
                    socialLocation: data.socialLocation || settings.preferences.socialLocation
                }
            });
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
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col space-y-2">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                    <Bot className="h-10 w-10 text-blue-600" />
                    {isAdmin ? 'System & Admin Settings' : 'User Settings'}
                </h1>
                <p className="text-gray-500 text-lg">
                    {isAdmin
                        ? 'Manage global AI behavior, security, and your personal context.'
                        : 'Personalize your profile and location preferences.'}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Settings Section */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Identity & Personality Section */}
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden ring-1 ring-gray-200">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b pb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-600 rounded-lg">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                                <CardTitle>Identity & Profile</CardTitle>
                            </div>
                            <CardDescription className="mt-2">
                                Manage how you appear as a Host{isAdmin ? ' and the AI personality' : ''}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="userName" className="text-base font-semibold">Full Name (Host Name)</Label>
                                    <Input
                                        id="userName"
                                        value={settings.name}
                                        onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                        placeholder="e.g. Kulwinder Singh"
                                        className="h-12 border-gray-200 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 italic">This name will be shown as the Host on all your public RSVP pages.</p>
                                </div>

                                {isAdmin && (
                                    <div className="space-y-2 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Label htmlFor="systemPrompt" className="text-base font-semibold text-purple-700">Global AI System Prompt</Label>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">ADMIN</span>
                                        </div>
                                        <textarea
                                            id="systemPrompt"
                                            value={settings.preferences.systemPrompt}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                preferences: { ...settings.preferences, systemPrompt: e.target.value }
                                            })}
                                            placeholder="e.g. You are a stylish Londoner who loves immersive theatre..."
                                            className="w-full min-h-[120px] p-3 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition-all"
                                        />
                                        <p className="text-xs text-gray-500 italic">This manages the personality of the AI for ALL users.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location Context Section (Visible to All) */}
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden ring-1 ring-gray-200">
                        <CardHeader className="bg-gradient-to-r from-cyan-50 to-teal-50 border-b pb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-cyan-600 rounded-lg">
                                    <Search className="h-5 w-5 text-white" />
                                </div>
                                <CardTitle>Location Context</CardTitle>
                            </div>
                            <CardDescription className="mt-2">
                                Set your default origins for different types of activities.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="defaultLocation" className="text-base font-semibold text-blue-800 flex items-center gap-2">
                                        HOME / ORIGIN
                                    </Label>
                                    <Input
                                        id="defaultLocation"
                                        value={settings.preferences.defaultLocation}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            preferences: { ...settings.preferences, defaultLocation: e.target.value }
                                        })}
                                        placeholder="e.g. Balham, London"
                                        className="h-12 border-gray-200 focus:ring-cyan-500"
                                    />
                                    <p className="text-[10px] text-gray-400">Used for local nature, hiking, and travel departures.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="socialLocation" className="text-base font-semibold text-purple-800 flex items-center gap-2">
                                        SOCIAL HUB
                                    </Label>
                                    <Input
                                        id="socialLocation"
                                        value={settings.preferences.socialLocation}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            preferences: { ...settings.preferences, socialLocation: e.target.value }
                                        })}
                                        placeholder="e.g. Soho, London"
                                        className="h-12 border-gray-200 focus:ring-cyan-500"
                                    />
                                    <p className="text-[10px] text-gray-400">Used for restaurants, theatre, and city social events.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* API Key Section - ADMIN ONLY */}
                    {isAdmin && (
                        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden ring-1 ring-gray-200">
                            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b pb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-indigo-600 rounded-lg">
                                            <Key className="h-5 w-5 text-white" />
                                        </div>
                                        <CardTitle>Google AI Credentials <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">ADMIN</span></CardTitle>
                                    </div>
                                    {settings.hasApiKey && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            Encrypted & Secure
                                        </div>
                                    )}
                                </div>
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
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Model Preferences - ADMIN ONLY */}
                    {isAdmin && (
                        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden ring-1 ring-gray-200">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b pb-6">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-purple-600 rounded-lg">
                                        <Bot className="h-5 w-5 text-white" />
                                    </div>
                                    <CardTitle>AI Model & Integration <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">ADMIN</span></CardTitle>
                                </div>
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
                                                <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Highly Reliable - Recommended)</SelectItem>
                                                <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Steady & Powerful)</SelectItem>
                                                <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (New / Experimental)</SelectItem>
                                                <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Powerful Preview)</SelectItem>
                                                <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Fast Next-Gen)</SelectItem>
                                                <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Low Cost)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-gray-400">Flash models are recommended for daily use.</p>
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
                                        <p className="text-[10px] text-gray-400">Allows AI to find REAL events and verify times/links.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar / Info */}
                <div className="space-y-6">
                    <Card className="bg-blue-600 text-white border-none shadow-xl overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-bold text-xl">{isAdmin ? 'Global Settings' : 'Your Profile'}</h3>
                            <p className="text-blue-100 text-sm leading-relaxed">
                                {isAdmin
                                    ? 'Settings you save here (AI Prompt, Model, API Key) will be applied GLOBALLY to all users. Location settings remain personal.'
                                    : 'Your name and location preferences are personal to you and help the AI give you better suggestions.'}
                            </p>
                            <div className="pt-2 border-t border-blue-500/30 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-xs font-medium text-blue-200 uppercase tracking-wider">Active Status: {isAdmin ? 'Admin' : 'User'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-3 shadow-sm">
                        <h4 className="font-semibold text-orange-800 flex items-center gap-2 text-sm">
                            <ShieldCheck className="h-4 w-4" />
                            Security & Design
                        </h4>
                        <p className="text-xs text-orange-700/80 leading-relaxed">
                            Encryption uses AES-256 with a unique server salt. Your raw credentials never touch our logs.
                        </p>
                    </div>

                    <div className="sticky top-6">
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
                                    <Save className="h-5 w-5" /> Save {isAdmin ? 'Global Config' : 'Profile'}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
