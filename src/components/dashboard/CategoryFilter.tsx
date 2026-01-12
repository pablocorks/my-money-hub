import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Filter } from 'lucide-react';
import { Category } from '@/hooks/useCategories';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onSelectionChange: (categoryIds: string[]) => void;
  label?: string;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onSelectionChange,
  label = 'Filtrar',
}: CategoryFilterProps) {
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onSelectionChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onSelectionChange([...selectedCategories, categoryId]);
    }
  };

  const clearFilters = () => {
    onSelectionChange([]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
          <Filter className="w-3 h-3" />
          {label}
          {selectedCategories.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
              {selectedCategories.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Filtrar por categoria</span>
            {selectedCategories.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>
                Limpar
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                Nenhuma categoria cadastrada
              </span>
            ) : (
              categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-secondary"
                >
                  <Checkbox
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${category.color}20`,
                      color: category.color,
                      border: `1px solid ${category.color}40`,
                    }}
                  >
                    {category.name}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
