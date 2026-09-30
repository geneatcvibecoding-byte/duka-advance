"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Copy, Eye, Filter, Pencil, RotateCcw } from "lucide-react";
import {
  bulkListingStatusAction,
  duplicateListingAction,
  relistAction,
  updateListingStatusAction,
} from "@/app/actions/listing";
import { formatTZS } from "@/lib/tz";
import { Badge, Button, buttonStyles } from "@/components/ui";

export type ManagedListing = {
  id: string;
  slug: string;
  title: string;
  price: number;
  status: string;
  viewCount: number;
  imageUrl: string | null;
};

/**
 * The seller's listing table.
 *
 * Checkboxes are not nested inside the bulk form — they point at it with the
 * HTML `form` attribute, because nesting one form inside another is invalid and
 * browsers silently drop the inner one.
 */
export function ListingManager({
  listings,
  locale,
  basePath,
  filters,
  labels,
}: {
  listings: ManagedListing[];
  locale: string;
  basePath: string;
  filters: { q: string; status: string; sort: string };
  labels: {
    search: string;
    apply: string;
    filterStatus: string;
    sortBy: string;
    all: string;
    statusOptions: { value: string; label: string }[];
    sortOptions: { value: string; label: string }[];
    selected: string;
    selectAll: string;
    bulkAction: string;
    edit: string;
    duplicate: string;
    relist: string;
    view: string;
    views: string;
    save: string;
    statusLabels: Record<string, string>;
    bulkStatusOptions: { value: string; label: string }[];
  };
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const allChecked = selected.length > 0 && selected.length === listings.length;

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  function toggleAll() {
    setSelected(allChecked ? [] : listings.map((listing) => listing.id));
  }

  return (
    <div className="space-y-4">
      <form
        method="get"
        action={basePath}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="min-w-[12rem] flex-1">
          <label className="field-label" htmlFor="listing-q">
            {labels.search}
          </label>
          <input
            id="listing-q"
            name="q"
            type="search"
            defaultValue={filters.q}
            className="field-input"
            placeholder={labels.search}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="listing-status">
            {labels.filterStatus}
          </label>
          <select
            id="listing-status"
            name="status"
            defaultValue={filters.status}
            className="field-input w-auto"
          >
            <option value="">{labels.all}</option>
            {labels.statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="listing-sort">
            {labels.sortBy}
          </label>
          <select
            id="listing-sort"
            name="sort"
            defaultValue={filters.sort}
            className="field-input w-auto"
          >
            {labels.sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" variant="secondary" size="md">
          <Filter size={16} aria-hidden />
          {labels.apply}
        </Button>
      </form>

      {listings.length > 0 ? (
        <form
          id="bulk-listing-form"
          action={bulkListingStatusAction}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5"
        >
          <input type="hidden" name="locale" value={locale} />

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-ink-300"
            />
            {selected.length > 0
              ? labels.selected.replace("{count}", String(selected.length))
              : labels.selectAll}
          </label>

          <select name="status" defaultValue="PAUSED" className="field-input h-9 w-auto text-sm">
            {labels.bulkStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button type="submit" variant="secondary" size="sm" disabled={selected.length === 0}>
            <Check size={15} aria-hidden />
            {labels.bulkAction}
          </Button>
        </form>
      ) : null}

      <ul className="space-y-3">
        {listings.map((listing) => {
          const live = listing.status === "ACTIVE";
          return (
            <li
              key={listing.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-ink-200 bg-white p-3"
            >
              <input
                type="checkbox"
                name="listingId"
                value={listing.id}
                form="bulk-listing-form"
                checked={selected.includes(listing.id)}
                onChange={() => toggle(listing.id)}
                className="h-4 w-4 shrink-0 rounded border-ink-300"
                aria-label={listing.title}
              />

              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
                {listing.imageUrl ? (
                  <img
                    src={listing.imageUrl}
                    alt=""
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/${locale}/marketplace/${listing.slug}`}
                  className="font-medium text-ink-900 hover:text-brand-700"
                >
                  {listing.title}
                </Link>
                <p className="flex flex-wrap gap-x-3 text-sm text-ink-500">
                  <span>{formatTZS(listing.price)}</span>
                  <span className="inline-flex items-center gap-1">
                    <Eye size={13} aria-hidden />
                    {labels.views.replace("{count}", String(listing.viewCount))}
                  </span>
                </p>
              </div>

              <Badge tone={live ? "success" : "neutral"}>
                {labels.statusLabels[listing.status] ?? listing.status}
              </Badge>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/${locale}/account/listings/${listing.id}/edit`}
                  className={buttonStyles("secondary", "sm")}
                >
                  <Pencil size={14} aria-hidden />
                  {labels.edit}
                </Link>

                <form action={duplicateListingAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="listingId" value={listing.id} />
                  <button type="submit" className={buttonStyles("secondary", "sm")}>
                    <Copy size={14} aria-hidden />
                    {labels.duplicate}
                  </button>
                </form>

                {live ? (
                  <form action={updateListingStatusAction} className="flex gap-2">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="listingId" value={listing.id} />
                    <select
                      name="status"
                      className="field-input h-9 w-auto text-sm"
                      defaultValue="PAUSED"
                    >
                      {labels.bulkStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className={buttonStyles("secondary", "sm")}>
                      {labels.save}
                    </button>
                  </form>
                ) : (
                  <form action={relistAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="listingId" value={listing.id} />
                    <button type="submit" className={buttonStyles("secondary", "sm")}>
                      <RotateCcw size={14} aria-hidden />
                      {labels.relist}
                    </button>
                  </form>
                )}

                <Link
                  href={`/${locale}/marketplace/${listing.slug}`}
                  className={buttonStyles("ghost", "sm")}
                >
                  {labels.view}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
