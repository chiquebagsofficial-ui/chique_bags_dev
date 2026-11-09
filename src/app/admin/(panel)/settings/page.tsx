import { PageHead } from "@/components/admin/ui";
import SettingsForm from "@/components/admin/SettingsForm";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  return (
    <>
      <PageHead title="Settings" subtitle="Store details, shipping and payment options" />
      <SettingsForm initial={await getSettings()} />
    </>
  );
}
