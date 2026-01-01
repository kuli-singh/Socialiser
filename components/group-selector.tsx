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


