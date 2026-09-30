import { prisma } from "@/lib/db";
import { formatDateTime, resolveLocale } from "@/lib/i18n";
import { formatPhone } from "@/lib/tz";
import { Badge } from "@/components/ui";

export const metadata = { title: "Students" };

export default async function AdminStudentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = resolveLocale(raw);

  const [universities, verified, unverifiedWithDomain] = await Promise.all([
    prisma.university.findMany({
      orderBy: { nameEn: "asc" },
      include: { _count: { select: { users: true } } },
    }),
    prisma.user.findMany({
      where: { studentVerifiedAt: { not: null }, role: "CUSTOMER" },
      orderBy: { studentVerifiedAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        studentNumber: true,
        studentVerifiedAt: true,
        university: { select: { nameEn: true } },
      },
    }),
    prisma.user.count({ where: { studentVerifiedAt: null, universityId: { not: null } } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Students</h1>
      <p className="mt-1 text-sm text-ink-600">
        Verification is self-serve (uni email code), so this is a ledger, not an
        approval queue. {unverifiedWithDomain} students have set a university but
        are not verified yet.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {universities.map((university) => (
          <div
            key={university.id}
            className="rounded-xl border border-ink-200 bg-white p-4"
          >
            <p className="font-semibold text-ink-900">{university.nameEn}</p>
            <p className="mt-0.5 text-xs text-ink-500">{university.emailDomain}</p>
            <p className="mt-2 text-sm text-ink-700">
              <span className="font-bold">{university._count.users}</span> members
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-bold text-ink-900">Verified students</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-ink-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-200 bg-ink-50 text-ink-700">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Student</th>
              <th scope="col" className="px-4 py-3 font-semibold">Phone</th>
              <th scope="col" className="px-4 py-3 font-semibold">University</th>
              <th scope="col" className="px-4 py-3 font-semibold">Student no.</th>
              <th scope="col" className="px-4 py-3 font-semibold">Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {verified.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-500">
                  Nobody has verified yet.
                </td>
              </tr>
            ) : (
              verified.map((student) => (
                <tr key={student.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{student.name}</p>
                    <p className="text-xs text-ink-500">{student.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {formatPhone(student.phone)}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {student.university?.nameEn ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-600">
                    {student.studentNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="success">
                      {formatDateTime(student.studentVerifiedAt ?? new Date(), locale)}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}