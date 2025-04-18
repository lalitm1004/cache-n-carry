import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedHostelRoomData() {
    const hostelClusters = [
      { id: 1, isDoubleSharing: true, roomsPerFloor: 30 },
      { id: 2, isDoubleSharing: true, roomsPerFloor: 30 },
      { id: 3, isDoubleSharing: true, roomsPerFloor: 30 },
      { id: 4, isDoubleSharing: false, roomsPerFloor: 45 },
      { id: 5, isDoubleSharing: false, roomsPerFloor: 45 },
    ];

    const blockNames = ["A", "B", "C"];
    const highestFloor = 5;

    for (const cluster of hostelClusters) {
      for (const blockName of blockNames) {
        const hostelName = `${cluster.id}${blockName}`;

        console.log(`\nCreating hostel ${hostelName}`);

        const hostel = await prisma.hostel.create({
          data: { name: hostelName }
        });

        for (let floor = 0; floor <= highestFloor; floor++) {
          const roomsToCreate: { hostelId: string, number: string }[] = [];

          for (let roomNum = 1; roomNum <= cluster.roomsPerFloor; roomNum++) {
            const formattedRoomNum = roomNum.toString().padStart(2, '0');
            const baseRoomNumber = `${floor}${formattedRoomNum}`;

            if (cluster.isDoubleSharing) {
              roomsToCreate.push({ hostelId: hostel.id, number: `${baseRoomNumber}A` });
              roomsToCreate.push({ hostelId: hostel.id, number: `${baseRoomNumber}B` });
            } else {
              roomsToCreate.push({ hostelId: hostel.id, number: baseRoomNumber });
            }
          }

          await prisma.room.createMany({ data: roomsToCreate });
          console.log(`Created ${roomsToCreate.length} rooms on floor ${floor} of hostel ${hostelName}`);
        }
      }
    }
  }

async function main() {
    await seedHostelRoomData()
        .then(() => console.log('✅ seeded Hostel and Room table'))
        .catch((e) => console.error(`🚨 ${e}`));
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1)
    })