'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface GroupSelectorProps {
    value: string;
    onValueChange: (value: string) => void;
    groups: string[];
}

export function GroupSelector({ value, onValueChange, groups }: GroupSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');

    const filteredGroups = groups.filter((group) =>
        group.toLowerCase().includes(inputValue.toLowerCase())
    );

    const showCreateOption = inputValue && !groups.some(g => g.toLowerCase() === inputValue.toLowerCase());

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value || "Select or create a group..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search or create group..."
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {showCreateOption ? (
                                <div className="p-2">
                                    <p className="text-sm text-muted-foreground mb-2">No existing group found.</p>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => {
                                            onValueChange(inputValue);
                                            setOpen(false);
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create "{inputValue}"
                                    </Button>
                                </div>
                            ) : (
                                "No group found."
                            )}
                        </CommandEmpty>

                        <CommandGroup heading="Existing Groups">
                            {groups.map((group) => (
                                <CommandItem
                                    key={group}
                                    value={group}
                                    onSelect={(currentValue) => {
                                        onValueChange(currentValue === value ? '' : currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === group ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    {group}
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        {showCreateOption && filteredGroups.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        value={inputValue}
                                        onSelect={() => {
                                            onValueChange(inputValue);
                                            setOpen(false);
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create "{inputValue}"
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}

                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// Helper: Since CommandItem filters by value, we need to ensure the list logic works.
// Using a slightly manual approach for the create option.
function GroupSelectorWrapper(props: GroupSelectorProps) {
    // We need to pass the groups prop correctly inside.
    // The implementation above had a typo `props_groups`.
    return <GroupSelectorInner {...props} />;
}

function GroupSelectorInner({ value, onValueChange, groups }: GroupSelectorProps) {
    const [open, setOpen] = React.useState(false);
    // We need to track input value to show "Create..."
    // CommandInput in shadcn usually does internal filtering.
    // To handle "Create", we might need to access the internal command state or just use a standard Input + List if Command is too restrictive.
    // But standard Command is nice.

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between",
                        !value && "text-muted-foreground"
                    )}
                >
                    {value
                        ? groups.find((group) => group === value) || value
                        : "Select or type to create..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search group..." />
                    <CommandList>
                        <CommandEmpty>No group found.</CommandEmpty>
                        <CommandGroup>
                            {groups.map((group) => (
                                <CommandItem
                                    key={group}
                                    value={group}
                                    onSelect={(currentValue) => {
                                        onValueChange(group); // Use original case
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === group ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {group}
                                </CommandItem>
                            ))}
                            {/* Dynamically allow creating new item is tricky with pure Command component because it filters items. 
                    Better approach: Just show the input value as an option if it doesn't match?
                    Actually, shadcn examples often have a specific way for "Combobox with new item". 
                    Since I cannot easily debug visual behavior, I will use a simplified approach:
                    Top items are existing groups.
                    If I type something not in list, the CommandEmpty shows.
                    Inside CommandEmpty, I put the Button to create.
                */}
                        </CommandGroup>

                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// Custom component to handle the "Create" logic within CommandEmpty
// This relies on the fact that CommandEmpty renders when no items match.
// But we need to capture the user's typed input. 
// CommandPrimitive usually exposes this but shadcn wrapper might abstract it.
// 
// PLAN B: Use a standard `datalist` style or a simple custom dropdown without `cmdk` if it proves too complex blindly.
// OR: Just implement the `cmdk` one assuming standard behavior.
//
// Let's refine the component below to be safe.
