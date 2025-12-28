'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Save, MapPin, Terminal, Loader2, Bot, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [defaultLocation, setDefaultLocation] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [preferredModel, setPreferredModel] = useState('gemini-1.5-flash');
    const [enableGoogleSearch, setEnableGoogleSearch] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const data = await response.json();
                setDefaultLocation(data.defaultLocation || '');
                setSystemPrompt(data.systemPrompt || '');
                setPreferredModel(data.preferredModel || 'gemini-1.5-flash');
                setEnableGoogleSearch(data.enableGoogleSearch !== undefined ? data.enableGoogleSearch : true);
            } else {
                toast.error('Failed to load settings');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            toast.error('Error loading settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    defaultLocation,
                    systemPrompt,
                    preferredModel,
                    enableGoogleSearch
                }),
            });

            if (response.ok) {
                toast.success('Settings saved successfully');
                router.refresh(); // Refresh to update any server components using these settings
            } else {
                toast.error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your application preferences and AI behavior.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <CardTitle>Location Preferences</CardTitle>
                        </div>
                        <CardDescription>
                            Set a default location so you don't have to share it every time.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="defaultLocation">Default Location</Label>
                            <Input
                                id="defaultLocation"
                                placeholder="e.g. London, UK"
                                value={defaultLocation}
                                onChange={(e) => setDefaultLocation(e.target.value)}
                            />
                            <p className="text-sm text-gray-500">
                                This location will be used as the starting point for AI recommendations unless you specify otherwise in the chat.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Terminal className="h-5 w-5 text-purple-600" />
                            <CardTitle>AI System Prompt</CardTitle>
                        </div>
                        <CardDescription>
                            Customize how the AI behaves. This instruction will be pushed to the AI system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="systemPrompt">System Instructions</Label>
                            <Textarea
                                id="systemPrompt"
                                rows={5}
                                placeholder="e.g. You are a helpful assistant who prioritizes budget-friendly options..."
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                className="font-mono text-sm"
                            />
                            <p className="text-sm text-gray-500">
                                These instructions will override or augment the default AI behavior. Use this to set a specific tone (e.g., "Be sarcastic", "Act like a pirate") or constraints (e.g., "Only suggest vegan restaurants").
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center space-x-2">
                            <Bot className="h-5 w-5 text-indigo-600" />
                            <CardTitle>AI Model Configuration</CardTitle>
                        </div>
                        <CardDescription>
                            Configure which AI model to use and its capabilities.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="preferredModel">AI Model</Label>
                            <Select value={preferredModel} onValueChange={setPreferredModel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended, Fast)</SelectItem>
                                    <SelectItem value="gemini-1.5-pro-latest">Gemini 1.5 Pro (High Intelligence)</SelectItem>
                                    <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-gray-500">
                                <strong>Gemini 1.5 Flash</strong> is the most stable and fast option.<br />
                                <strong>Gemini 1.5 Pro</strong> is smarter but may have lower rate limits.<br />
                                <strong>Gemini 2.0 Flash</strong> is experimental (preview).
                            </p>
                        </div>

                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="enableGoogleSearch" className="flex items-center">
                                    <Search className="h-4 w-4 mr-2" />
                                    Enable Real-World Search
                                </Label>
                                <p className="text-sm text-gray-500">
                                    Allow the AI to search Google for real-time events.
                                </p>
                            </div>
                            <Switch
                                id="enableGoogleSearch"
                                checked={enableGoogleSearch}
                                onCheckedChange={setEnableGoogleSearch}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Settings
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
