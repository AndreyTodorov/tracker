import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './Command';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  icon?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onSelect: (value: string) => void;
  onSearchChange?: (search: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function Combobox({
  options,
  value,
  onSelect,
  onSearchChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  label,
  error,
  disabled,
  isLoading,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = options.find((option) => option.value === value);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-200 mb-1.5">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-gray-400',
              error && 'ring-2 ring-red-500'
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {selectedOption?.icon && (
                <img src={selectedOption.icon} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
              )}
              <span className="truncate">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-slate-900 border border-slate-600" align="start">
          <Command shouldFilter={false} className="bg-transparent">
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={handleSearch}
              className="text-gray-100"
            />
            <CommandList className="bg-transparent">
              {isLoading ? (
                <div className="py-6 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              ) : options.length === 0 ? (
                <CommandEmpty className="text-gray-400">{emptyText}</CommandEmpty>
              ) : (
                <CommandGroup className="bg-transparent">
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={(currentValue) => {
                        onSelect(currentValue === value ? '' : currentValue);
                        setOpen(false);
                        setSearch('');
                      }}
                      className="text-gray-200 data-[selected=true]:bg-slate-700 data-[selected=true]:text-white hover:bg-slate-800 cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 flex-shrink-0 text-blue-400',
                          value === option.value ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {option.icon && (
                        <img src={option.icon} alt="" className="mr-2 w-5 h-5 rounded-full flex-shrink-0" />
                      )}
                      <span className="truncate">{option.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
