import type { AdminCategory } from '@/lib/api/admin-catalog';

export type CategoryHierarchyItem = AdminCategory;

export interface CategoryTreeNode {
  category: CategoryHierarchyItem;
  depth: number;
  path: string;
  children: CategoryTreeNode[];
}

export interface CategorySelection {
  parentId: string;
  childId: string;
  selectedId: string;
  selectedCategory: CategoryHierarchyItem | null;
  parentCategory: CategoryHierarchyItem | null;
}

function compareCategoryItems(a: CategoryHierarchyItem, b: CategoryHierarchyItem) {
  if (!a.parent_id && b.parent_id) return -1;
  if (a.parent_id && !b.parent_id) return 1;

  if (a.order_index !== b.order_index) {
    return a.order_index - b.order_index;
  }

  return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
}

export function buildCategoryTree(categories: CategoryHierarchyItem[]): CategoryTreeNode[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const childrenByParent = new Map<string | null, CategoryHierarchyItem[]>();

  for (const category of categories) {
    const parentKey = category.parent_id && byId.has(category.parent_id) ? category.parent_id : null;
    const current = childrenByParent.get(parentKey) ?? [];
    current.push(category);
    childrenByParent.set(parentKey, current);
  }

  for (const children of childrenByParent.values()) {
    children.sort(compareCategoryItems);
  }

  const visit = (category: CategoryHierarchyItem, depth: number, ancestorIds: Set<string>, parentPath: string): CategoryTreeNode => {
    const nextAncestors = new Set(ancestorIds);
    nextAncestors.add(category.id);

    const path = parentPath ? `${parentPath} > ${category.name}` : category.name;
    const children = (childrenByParent.get(category.id) ?? [])
      .filter((child) => !nextAncestors.has(child.id))
      .map((child) => visit(child, depth + 1, nextAncestors, path));

    return { category, depth, path, children };
  };

  const roots = (childrenByParent.get(null) ?? [])
    .slice()
    .sort(compareCategoryItems);

  return roots.map((category) => visit(category, 0, new Set<string>(), ''));
}

export function flattenCategoryTree(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  const flattened: CategoryTreeNode[] = [];

  const walk = (node: CategoryTreeNode) => {
    flattened.push(node);
    node.children.forEach(walk);
  };

  nodes.forEach(walk);

  return flattened;
}

export function buildCategoryPathOptions(categories: CategoryHierarchyItem[]) {
  return flattenCategoryTree(buildCategoryTree(categories)).map((node) => ({
    id: node.category.id,
    parent_id: node.category.parent_id,
    name: node.category.name,
    order_index: node.category.order_index,
    depth: node.depth,
    path: node.path,
  }));
}

export function getTopLevelCategories(categories: CategoryHierarchyItem[]) {
  return buildCategoryTree(categories).map((node) => node.category);
}

export function getChildCategories(categories: CategoryHierarchyItem[], parentId: string) {
  return categories
    .filter((category) => category.parent_id === parentId)
    .sort(compareCategoryItems);
}

export function getCategoryById(categories: CategoryHierarchyItem[], categoryId: string | null | undefined) {
  if (!categoryId) return null;
  return categories.find((category) => category.id === categoryId) ?? null;
}

export function getCategorySelection(categories: CategoryHierarchyItem[], categoryId: string | null | undefined): CategorySelection {
  const selectedCategory = getCategoryById(categories, categoryId);

  if (!selectedCategory) {
    return {
      parentId: '',
      childId: '',
      selectedId: '',
      selectedCategory: null,
      parentCategory: null,
    };
  }

  if (!selectedCategory.parent_id) {
    return {
      parentId: selectedCategory.id,
      childId: '',
      selectedId: selectedCategory.id,
      selectedCategory,
      parentCategory: selectedCategory,
    };
  }

  const parentCategory = getCategoryById(categories, selectedCategory.parent_id);

  return {
    parentId: parentCategory?.id ?? '',
    childId: selectedCategory.id,
    selectedId: selectedCategory.id,
    selectedCategory,
    parentCategory,
  };
}

export function hasChildCategories(categories: CategoryHierarchyItem[], parentId: string) {
  return categories.some((category) => category.parent_id === parentId);
}

export function getCategoryDescendantIds(categories: CategoryHierarchyItem[], categoryId: string) {
  const tree = buildCategoryTree(categories);
  const descendants = new Set<string>();

  const walk = (node: CategoryTreeNode, found: boolean) => {
    const nextFound = found || node.category.id === categoryId;

    if (nextFound && node.category.id !== categoryId) {
      descendants.add(node.category.id);
    }

    node.children.forEach((child) => walk(child, nextFound));
  };

  tree.forEach((node) => walk(node, false));

  return descendants;
}
