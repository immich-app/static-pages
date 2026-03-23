# FUTO Backups Survey

Survey URL: https://survey.futo.org/forms/futo-backups-survey-fy4lqx

## Section 1: Questions about your Immich server, your library and your internet speed

### Q1: Where is your Immich server located?
- North America - East (US East Coast, Eastern Canada)
- North America - Central (US Midwest, Central Canada)
- North America - West (US West Coast, Western Canada)
- South America
- Europe - West (UK, France, Netherlands, Nordics, etc.)
- Europe - East (Poland, Romania, Balkans, Baltics, etc.)
- Asia-Pacific - East (Japan, South Korea, Taiwan, etc.)
- Asia-Pacific - Southeast (Singapore, Australia, India, etc.)
- Middle East / Africa
- Other

### Q2: What is your server's download speed?
- Less than 10Mbps
- 10 - 25Mbps
- 26 - 50Mbps
- 51 - 100Mbps
- 101 - 500Mbps
- 501 - 1Gbps
- Over 1Gbps
- I'm not sure

### Q3: What is your server's upload speed?
- Less than 10Mbps
- 10 - 25Mbps
- 26 - 50Mbps
- 51 - 100Mbps
- 101 - 500Mbps
- 501 - 1Gbps
- Over 1Gbps
- I'm not sure

### Q4: What is the total size of your Immich library?
- Less than 100GB
- 100GB - 250GB
- 250GB - 500GB
- 500GB - 1TB
- 1 - 5TB
- 5 - 10TB
- 10 - 50TB
- 50TB+

### Q5: Roughly what percentage of your library by storage used is video?
> Example: If you have 600GB of photos & videos combined and 500GB of that is videos, select 80%.

- Almost none (less than 10%)
- A small portion (10 - 25%)
- A significant chunk (25 - 50%)
- Mostly video (50 - 75%)
- Almost entirely video (75%+)
- I'm not sure

### Q6: How would you describe your self-hosting experience?
- Novice - Immich is the first and only service I run and I followed a guide to do that
- Beginner - I have a few self-hosted services running but that is it
- Intermediate - I'm comfortable with Docker, basic networking, and Linux
- Advanced - I manage multiple services, custom configs, and infrastructure
- Expert - I work in IT/infrastructure professionally or have deep sysadmin experience

## Section 2: Your current backup solution

### Q7: How do you currently back up your Immich data?
- I don't currently have a backup
- RAID (but no offsite/separate copy)
- ZFS snapshots / replication
- Restic / Borg / Kopia or similar de-duplicating backup tool
- Syncthing / rsync to another machine
- Cloud sync (e.g. rclone to R2, S3, Backblaze B2, etc.)
- Manual / ad-hoc copies
- Other

**"Other" text entry:** Please enter how you currently back up your Immich instance

### Q8: How often do you run backups?
- Continuously / real-time
- Daily
- Weekly
- Monthly
- Less than monthly
- I don't have automated backups

### Q9: Roughly how much new data do you add to your Immich library in a typical month?
- Less than 1GB
- 1 - 10GB
- 10 - 50GB
- 50 - 100GB
- 100 - 500GB
- Over 500GB

## Section 3: Questions about FUTO Backups - and your interest in it

### Q10: How interested are you in a service like this?
- Very interested
- Interested
- Undecided / Need more details
- Not interested

### Q11: How much would you be willing to pay per TB per month for this service?
- $3.99/TB/Month
- $4.99/TB/Month
- $5.99/TB/Month
- $6.99/TB/Month
- $7.99/TB/Month
- $8.99/TB/Month
- $9.99/TB/Month
- I wouldn't pay for this

### Q12: How many copies of your backup would you want stored in the cloud?
> Each additional copy is stored in a separate location for extra redundancy and will cost extra

- 1 copy
- 2 copies
- 3 copies
- 4+ copies
- I'm not sure / It depends on the cost

## Section 4: Additional questions about how you host Immich

### Q13: What type of storage does your Immich server use for its media library?
- Directly attached storage
- Network attached storage
- Cloud/object storage (e.g. S3/MinIO)
- Other

**"Other" text entry:** Please enter what type of storage does your Immich server use for its media library

### Q14: What type of drives primarily make up your media storage?
- NVMe SSD
- SATA SSD
- HDD (spinning disk)
- Other

**"Other" text entry:** Please enter what type of drives primarily make up your media storage

### Q15: What is the underlying OS or Hypervisor running your Immich server?
- Bare metal Linux (Ubuntu, Debian, etc.)
- Proxmox VE
- TrueNAS / FreeNAS
- Unraid
- Windows / MacOS
- NixOS
- Umbrel
- ZimaOS
- HexOS
- Other

**"Other" text entry:** Please enter the underlying OS or Hypervisor running your Immich server

### Q16: How are you running Immich?
- Docker / Docker Compose
- Kubernetes
- LXC / System Container
- Nix
- Other

**"Other" text entry:** Please enter how you are running Immich

## Section 5: Private Beta Signup

### Q17: Beta Program
> We're planning a closed beta before the full launch. If you'd like to be considered for early access, enter your email below.

*Text entry:* Email address (name@example.com)

### Q18: Get Updates
> You didn't enroll in the beta program, if you would still like to receive product updates though, you can enter your email below.

*Text entry:* Email address (name@example.com)

### Q19: Is there anything else you'd like to share?
> Any thoughts, concerns, features you'd want, or questions about a managed backup service for Immich

*Rich text entry (0/5000 characters)*
