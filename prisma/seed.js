const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@cobropilot.local" },
    update: {
      name: "Demo CobroPilot",
      companyName: "CobroPilot Demo",
    },
    create: {
      email: "demo@cobropilot.local",
      name: "Demo CobroPilot",
      companyName: "CobroPilot Demo",
    },
  });

  await prisma.reminder.deleteMany({
    where: { userId: user.id },
  });

  await prisma.invoice.deleteMany({
    where: { userId: user.id },
  });

  await prisma.customer.deleteMany({
    where: { userId: user.id },
  });

  const customer1 = await prisma.customer.create({
    data: {
      userId: user.id,
      name: "Reformas García",
      email: "facturas@reformasgarcia.es",
      phone: "600111222",
      company: "Reformas García",
      notes: "Cliente habitual",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      userId: user.id,
      name: "Clínica Delta",
      email: "admin@clinicadelta.es",
      phone: "600333444",
      company: "Clínica Delta",
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      userId: user.id,
      name: "María López",
      email: "maria@example.com",
      phone: "600555666",
    },
  });

  const invoice1 = await prisma.invoice.create({
    data: {
      userId: user.id,
      customerId: customer1.id,
      concept: "Instalación eléctrica local comercial",
      invoiceNumber: "CP-2026-001",
      amount: "450.00",
      dueDate: addDays(-10),
      status: "OVERDUE",
      notes: "Primer aviso pendiente",
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      userId: user.id,
      customerId: customer2.id,
      concept: "Reparación de avería urgente",
      invoiceNumber: "CP-2026-002",
      amount: "180.00",
      dueDate: addDays(5),
      status: "PENDING",
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      userId: user.id,
      customerId: customer3.id,
      concept: "Cambio de termo",
      invoiceNumber: "CP-2026-003",
      amount: "95.00",
      dueDate: addDays(-20),
      status: "PAID",
      paidAt: addDays(-15),
    },
  });

  await prisma.reminder.create({
    data: {
      userId: user.id,
      invoiceId: invoice1.id,
      channel: "EMAIL",
      scheduledAt: new Date(),
      status: "PENDING",
      message: "Recordatorio amistoso de pago pendiente.",
    },
  });

  await prisma.reminder.create({
    data: {
      userId: user.id,
      invoiceId: invoice2.id,
      channel: "WHATSAPP",
      scheduledAt: addDays(2),
      status: "PENDING",
      message: "Aviso preventivo antes del vencimiento.",
    },
  });

  console.log("Datos demo creados correctamente.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });