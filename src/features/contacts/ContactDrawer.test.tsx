import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ContactDrawer } from "./ContactDrawer";

describe("ContactDrawer layout contract", () => {
  test("submit footer is pinned outside the scrolling fields region", () => {
    const { unmount } = render(
      <ContactDrawer open contact={null} onClose={() => undefined} onSaved={() => undefined} />,
    );

    const scrollRegion = screen.getByTestId("contact-fields-scroll");
    const footer = screen.getByTestId("drawer-footer");
    expect(scrollRegion.className).toContain("overflow-y-auto");
    expect(footer.contains(screen.getByRole("button", { name: /add contact/i }))).toBe(true);
    expect(scrollRegion.contains(footer)).toBe(false);
    // Fields scroll; actions don't.
    expect(scrollRegion.contains(screen.getByLabelText("Name"))).toBe(true);

    unmount();
  });

  test("name-missing submit shows an inline error instead of saving silently", () => {
    const onSaved = vi.fn();
    const { unmount } = render(
      <ContactDrawer open contact={null} onClose={() => undefined} onSaved={onSaved} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /add contact/i }));
    expect(screen.getByText("Give this contact a name.")).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();

    unmount();
  });
});
