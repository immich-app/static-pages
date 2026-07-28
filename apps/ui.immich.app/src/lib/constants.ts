import { goto } from '$app/navigation';
import { asComponentHref } from '$lib/utilities.js';
import {
  defaultProvider,
  linkCommands,
  MenuItemType,
  toastManager,
  type ActionItem,
  type ActionItemHandler,
  type CarouselImageItem,
  type IconLike,
  type MenuItems,
  type Theme,
} from '@immich/ui';
import {
  mdiAccountCircle,
  mdiAccountCircleOutline,
  mdiAlert,
  mdiAlertOutline,
  mdiApplication,
  mdiApplicationOutline,
  mdiBullhornVariant,
  mdiBullhornVariantOutline,
  mdiButtonCursor,
  mdiButtonPointer,
  mdiCalendar,
  mdiCard,
  mdiCardOutline,
  mdiCheckboxMarked,
  mdiCheckboxMultipleMarked,
  mdiCheckboxMultipleMarkedOutline,
  mdiCheckboxOutline,
  mdiClock,
  mdiClockOutline,
  mdiCloseCircle,
  mdiCloseCircleOutline,
  mdiCodeBlockBraces,
  mdiCodeBraces,
  mdiContentCopy,
  mdiDotsCircle,
  mdiDotsVertical,
  mdiDownload,
  mdiFormatHeaderPound,
  mdiFormDropdown,
  mdiFormTextarea,
  mdiFormTextbox,
  mdiFormTextboxPassword,
  mdiGauge,
  mdiHelpBox,
  mdiHelpBoxOutline,
  mdiHomeCircle,
  mdiHomeCircleOutline,
  mdiImage,
  mdiImageOutline,
  mdiInformationSlabCircle,
  mdiInformationSlabCircleOutline,
  mdiKeyboardVariant,
  mdiLanguageMarkdownOutline,
  mdiLink,
  mdiListBox,
  mdiListBoxOutline,
  mdiLockSmart,
  mdiMenu,
  mdiMessageAlert,
  mdiMessageAlertOutline,
  mdiNumeric,
  mdiPalette,
  mdiPanVertical,
  mdiPartyPopper,
  mdiPencilOutline,
  mdiProgressHelper,
  mdiShareVariant,
  mdiSlashForward,
  mdiSquare,
  mdiSquareOutline,
  mdiTable,
  mdiTag,
  mdiTagOutline,
  mdiThemeLightDark,
  mdiToggleSwitch,
  mdiToggleSwitchOutline,
  mdiTrashCanOutline,
  mdiVectorSquare,
  mdiViewCarousel,
  mdiViewCarouselOutline,
  mdiViewSequential,
  mdiViewSequentialOutline,
  mdiWindowMaximize,
} from '@mdi/js';
import { siGithub } from 'simple-icons';
import type { Component } from 'svelte';

export enum DisplayOption {
  Both = 'both',
  Light = 'light',
  Dark = 'dark',
}

export type ExampleItem = {
  title: string;
  code: string;
  component: Component;
  theme?: Theme;
};

export type ExampleCardProps = ExampleItem;

export const siteMetadata = {
  title: 'Immich UI',
  description: 'A Svelte component library for Immich',
};

export type ComponentItem = {
  name: string;
  title?: string;
  href?: string;
  icon: IconLike;
  activeIcon?: string;
  items?: ComponentItem[];
};

export type ComponentGroup = {
  title: string;
  components: ComponentItem[];
};

export const components: ComponentItem[] = [
  { name: 'AnnouncementBanner', icon: mdiBullhornVariantOutline, activeIcon: mdiBullhornVariant },
  { name: 'AppShell', icon: mdiApplicationOutline, activeIcon: mdiApplication },
  { name: 'Alert', icon: mdiAlertOutline, activeIcon: mdiAlert },
  { name: 'Avatar', icon: mdiAccountCircleOutline, activeIcon: mdiAccountCircle },
  { name: 'Badge', icon: mdiTagOutline, activeIcon: mdiTag },
  { name: 'Breadcrumbs', icon: mdiSlashForward },
  {
    name: 'Button',
    title: 'Buttons',
    icon: mdiButtonCursor,
    items: [
      { name: 'ActionButton', icon: mdiButtonPointer },
      { name: 'CloseButton', icon: mdiCloseCircleOutline, activeIcon: mdiCloseCircle },
      { name: 'IconButton', icon: mdiHomeCircleOutline, activeIcon: mdiHomeCircle },
      { name: 'ListButton', icon: mdiButtonPointer },
    ],
  },
  { name: 'Card', icon: mdiCardOutline, activeIcon: mdiCard },
  { name: 'Checkbox', icon: mdiCheckboxOutline, activeIcon: mdiCheckboxMarked },
  { name: 'Code', icon: mdiCodeBraces },
  { name: 'CodeBlock', icon: mdiCodeBlockBraces },
  { name: 'Colors', icon: mdiPalette },
  { name: 'CommandPalette', icon: mdiMenu, activeIcon: mdiMenu },
  { name: 'Container', icon: mdiSquareOutline, activeIcon: mdiSquare },
  { name: 'ContextMenu', icon: mdiDotsVertical },
  {
    name: 'ControlBar',
    icon: mdiApplicationOutline,
    activeIcon: mdiApplication,
    items: [{ name: 'ActionBar', icon: mdiCardOutline, activeIcon: mdiCard }],
  },
  { name: 'DatePicker', icon: mdiCalendar },
  { name: 'Field', icon: mdiListBoxOutline, activeIcon: mdiListBox },
  { name: 'FormatBytes', icon: mdiNumeric },
  { name: 'GithubLink', icon: siGithub },
  { name: 'Heading', icon: mdiFormTextbox },
  { name: 'HelperText', icon: mdiHelpBoxOutline, activeIcon: mdiHelpBox },
  { name: 'Icon', icon: mdiVectorSquare },
  { name: 'ImageCarousel', icon: mdiViewCarouselOutline, activeIcon: mdiViewCarousel },
  { name: 'Input', icon: mdiFormTextbox },
  { name: 'Kbd', icon: mdiKeyboardVariant },
  { name: 'Link', icon: mdiLink },
  { name: 'LoadingSpinner', icon: mdiDotsCircle },
  { name: 'Logo', icon: mdiImageOutline, activeIcon: mdiImage },
  { name: 'Markdown', icon: mdiLanguageMarkdownOutline, activeIcon: mdiLanguageMarkdownOutline },
  { name: 'Meter', icon: mdiGauge },
  {
    name: 'Modal',
    title: 'Modals',
    icon: mdiWindowMaximize,
    items: [
      { name: 'BasicModal', icon: mdiWindowMaximize },
      { name: 'ConfirmModal', icon: mdiCheckboxOutline },
      { name: 'FormModal', icon: mdiWindowMaximize },
    ],
  },
  { name: 'MultiSelect', icon: mdiCheckboxMultipleMarkedOutline, activeIcon: mdiCheckboxMultipleMarked },
  { name: 'Navbar', icon: mdiMenu },
  { name: 'NumberInput', icon: mdiNumeric },
  { name: 'PasswordInput', icon: mdiFormTextboxPassword },
  { name: 'PinInput', icon: mdiLockSmart },
  { name: 'ProgressBar', icon: mdiProgressHelper },
  { name: 'Select', icon: mdiFormDropdown },
  { name: 'SupporterBadge', icon: mdiPartyPopper },
  { name: 'Switch', icon: mdiToggleSwitchOutline, activeIcon: mdiToggleSwitch },
  { name: 'Scrollable', icon: mdiPanVertical },
  { name: 'Stack', icon: mdiViewSequentialOutline, activeIcon: mdiViewSequential },
  { name: 'Table', icon: mdiTable },
  { name: 'Text', icon: mdiFormatHeaderPound },
  { name: 'Textarea', icon: mdiFormTextarea },
  { name: 'ThemeSwitcher', icon: mdiThemeLightDark },
  { name: 'TimeInput', icon: mdiClockOutline, activeIcon: mdiClock },
  { name: 'Toast', icon: mdiMessageAlertOutline, activeIcon: mdiMessageAlert },
  { name: 'Tooltip', icon: mdiInformationSlabCircleOutline, activeIcon: mdiInformationSlabCircle },
];

const onAction: ActionItemHandler = (item) => {
  toastManager.show({
    title: `Clicked ${item.title}`,
    color: item.color ?? 'primary',
    icon: item.icon,
  });
};

export const ExampleActions = {
  Copy: { title: 'Copy', icon: mdiContentCopy, onAction },
  Share: { title: 'Share', icon: mdiShareVariant, onAction },
  Edit: { title: 'Edit album', icon: mdiPencilOutline, onAction },
  Download: { title: 'Download', icon: mdiDownload, onAction },
  Delete: { title: 'Delete', icon: mdiTrashCanOutline, color: 'danger', onAction },
} satisfies Record<string, ActionItem>;

export const exampleActions: ActionItem[] = [
  ExampleActions.Share,
  ExampleActions.Copy,
  ExampleActions.Download,
  ExampleActions.Edit,
  ExampleActions.Delete,
];

export const exampleMenuItems: MenuItems = [
  ExampleActions.Share,
  ExampleActions.Copy,
  ExampleActions.Edit,
  ExampleActions.Download,
  MenuItemType.Divider,
  ExampleActions.Delete,
];

export const carouselImageItems: CarouselImageItem[] = [
  {
    title: '1 year ago',
    href: '#',
    src: 'https://picsum.photos/id/1011/800/600',
    alt: 'Sample image',
  },
  {
    title: '2 years ago',
    href: '#',
    src: 'https://picsum.photos/id/1012/800/600',
    alt: 'Sample image',
  },
  {
    title: '3 years ago',
    href: '#',
    src: 'https://picsum.photos/id/1013/800/600',
    alt: 'Sample image',
  },
  {
    title: '4 years ago',
    href: '#',
    src: 'https://picsum.photos/id/1015/800/600',
    alt: 'Sample image',
  },
  {
    title: '5 years ago',
    href: '#',
    src: 'https://picsum.photos/id/1016/800/600',
    alt: 'Sample image',
  },
  {
    title: '6 years ago',
    href: '#',
    src: 'https://picsum.photos/id/1018/800/600',
    alt: 'Sample image',
  },
  {
    title: '7 years ago',
    href: '#',
    src: 'https://picsum.photos/id/1020/800/600',
    alt: 'Sample image',
  },
  {
    title: '8 years ago',
    href: '#',
    src: 'https://picsum.photos/id/1024/800/600',
    alt: 'Sample image',
  },
];

export const locales = [
  { code: 'af-ZA', name: 'Afrikaans (South Africa)' },
  { code: 'sq-AL', name: 'Albanian (Albania)' },
  { code: 'ar-DZ', name: 'Arabic (Algeria)' },
  { code: 'ar-BH', name: 'Arabic (Bahrain)' },
  { code: 'ar-EG', name: 'Arabic (Egypt)' },
  { code: 'ar-IQ', name: 'Arabic (Iraq)' },
  { code: 'ar-JO', name: 'Arabic (Jordan)' },
  { code: 'ar-KW', name: 'Arabic (Kuwait)' },
  { code: 'ar-LB', name: 'Arabic (Lebanon)' },
  { code: 'ar-LY', name: 'Arabic (Libya)' },
  { code: 'ar-MA', name: 'Arabic (Morocco)' },
  { code: 'ar-OM', name: 'Arabic (Oman)' },
  { code: 'ar-QA', name: 'Arabic (Qatar)' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
  { code: 'ar-SY', name: 'Arabic (Syria)' },
  { code: 'ar-TN', name: 'Arabic (Tunisia)' },
  { code: 'ar-AE', name: 'Arabic (United Arab Emirates)' },
  { code: 'ar-YE', name: 'Arabic (Yemen)' },
  { code: 'hy-AM', name: 'Armenian (Armenia)' },
  { code: 'az-AZ', name: 'Azerbaijani (Azerbaijan)' },
  { code: 'eu-ES', name: 'Basque (Spain)' },
  { code: 'be-BY', name: 'Belarusian (Belarus)' },
  { code: 'bn-IN', name: 'Bengali (India)' },
  { code: 'bs-BA', name: 'Bosnian (Bosnia and Herzegovina)' },
  { code: 'bg-BG', name: 'Bulgarian (Bulgaria)' },
  { code: 'ca-ES', name: 'Catalan (Spain)' },
  { code: 'zh-CN', name: 'Chinese (China)' },
  { code: 'zh-HK', name: 'Chinese (Hong Kong SAR China)' },
  { code: 'zh-MO', name: 'Chinese (Macao SAR China)' },
  { code: 'zh-SG', name: 'Chinese (Singapore)' },
  { code: 'zh-TW', name: 'Chinese (Taiwan)' },
  { code: 'hr-HR', name: 'Croatian (Croatia)' },
  { code: 'cs-CZ', name: 'Czech (Czech Republic)' },
  { code: 'da-DK', name: 'Danish (Denmark)' },
  { code: 'nl-BE', name: 'Dutch (Belgium)' },
  { code: 'nl-NL', name: 'Dutch (Netherlands)' },
  { code: 'en-AU', name: 'English (Australia)' },
  { code: 'en-BZ', name: 'English (Belize)' },
  { code: 'en-CA', name: 'English (Canada)' },
  { code: 'en-IE', name: 'English (Ireland)' },
  { code: 'en-JM', name: 'English (Jamaica)' },
  { code: 'en-NZ', name: 'English (New Zealand)' },
  { code: 'en-PH', name: 'English (Philippines)' },
  { code: 'en-ZA', name: 'English (South Africa)' },
  { code: 'en-TT', name: 'English (Trinidad and Tobago)' },
  { code: 'en-VI', name: 'English (U.S. Virgin Islands)' },
  { code: 'en-GB', name: 'English (United Kingdom)' },
  { code: 'en-US', name: 'English (United States)' },
  { code: 'en-ZW', name: 'English (Zimbabwe)' },
  { code: 'et-EE', name: 'Estonian (Estonia)' },
  { code: 'fo-FO', name: 'Faroese (Faroe Islands)' },
  { code: 'fi-FI', name: 'Finnish (Finland)' },
  { code: 'fr-BE', name: 'French (Belgium)' },
  { code: 'fr-CA', name: 'French (Canada)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'fr-LU', name: 'French (Luxembourg)' },
  { code: 'fr-MC', name: 'French (Monaco)' },
  { code: 'fr-CH', name: 'French (Switzerland)' },
  { code: 'gl-ES', name: 'Galician (Spain)' },
  { code: 'ka-GE', name: 'Georgian (Georgia)' },
  { code: 'de-AT', name: 'German (Austria)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'de-LI', name: 'German (Liechtenstein)' },
  { code: 'de-LU', name: 'German (Luxembourg)' },
  { code: 'de-CH', name: 'German (Switzerland)' },
  { code: 'el-GR', name: 'Greek (Greece)' },
  { code: 'gu-IN', name: 'Gujarati (India)' },
  { code: 'he-IL', name: 'Hebrew (Israel)' },
  { code: 'hi-IN', name: 'Hindi (India)' },
  { code: 'hu-HU', name: 'Hungarian (Hungary)' },
  { code: 'is-IS', name: 'Icelandic (Iceland)' },
  { code: 'id-ID', name: 'Indonesian (Indonesia)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'it-CH', name: 'Italian (Switzerland)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'kn-IN', name: 'Kannada (India)' },
  { code: 'kk-KZ', name: 'Kazakh (Kazakhstan)' },
  { code: 'kok-IN', name: 'Konkani (India)' },
  { code: 'ko-KR', name: 'Korean (South Korea)' },
  { code: 'lv-LV', name: 'Latvian (Latvia)' },
  { code: 'lt-LT', name: 'Lithuanian (Lithuania)' },
  { code: 'mk-MK', name: 'Macedonian (Macedonia)' },
  { code: 'ms-BN', name: 'Malay (Brunei)' },
  { code: 'ms-MY', name: 'Malay (Malaysia)' },
  { code: 'ml-IN', name: 'Malayalam (India)' },
  { code: 'mt-MT', name: 'Maltese (Malta)' },
  { code: 'mr-IN', name: 'Marathi (India)' },
  { code: 'mn-MN', name: 'Mongolian (Mongolia)' },
  { code: 'se-NO', name: 'Northern Sami (Norway)' },
  { code: 'nb-NO', name: 'Norwegian Bokmål (Norway)' },
  { code: 'nn-NO', name: 'Norwegian Nynorsk (Norway)' },
  { code: 'fa-IR', name: 'Persian (Iran)' },
  { code: 'pl-PL', name: 'Polish (Poland)' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)' },
  { code: 'pa-IN', name: 'Punjabi (India)' },
  { code: 'ro-RO', name: 'Romanian (Romania)' },
  { code: 'ru-RU', name: 'Russian (Russia)' },
  { code: 'sr-BA', name: 'Serbian (Bosnia and Herzegovina)' },
  { code: 'sr-CS', name: 'Serbian (Serbia And Montenegro)' },
  { code: 'sk-SK', name: 'Slovak (Slovakia)' },
  { code: 'sl-SI', name: 'Slovenian (Slovenia)' },
  { code: 'es-AR', name: 'Spanish (Argentina)' },
  { code: 'es-BO', name: 'Spanish (Bolivia)' },
  { code: 'es-CL', name: 'Spanish (Chile)' },
  { code: 'es-CO', name: 'Spanish (Colombia)' },
  { code: 'es-CR', name: 'Spanish (Costa Rica)' },
  { code: 'es-DO', name: 'Spanish (Dominican Republic)' },
  { code: 'es-EC', name: 'Spanish (Ecuador)' },
  { code: 'es-SV', name: 'Spanish (El Salvador)' },
  { code: 'es-GT', name: 'Spanish (Guatemala)' },
  { code: 'es-HN', name: 'Spanish (Honduras)' },
  { code: 'es-MX', name: 'Spanish (Mexico)' },
  { code: 'es-NI', name: 'Spanish (Nicaragua)' },
  { code: 'es-PA', name: 'Spanish (Panama)' },
  { code: 'es-PY', name: 'Spanish (Paraguay)' },
  { code: 'es-PE', name: 'Spanish (Peru)' },
  { code: 'es-PR', name: 'Spanish (Puerto Rico)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-UY', name: 'Spanish (Uruguay)' },
  { code: 'es-VE', name: 'Spanish (Venezuela)' },
  { code: 'sw-KE', name: 'Swahili (Kenya)' },
  { code: 'sv-FI', name: 'Swedish (Finland)' },
  { code: 'sv-SE', name: 'Swedish (Sweden)' },
  { code: 'te-IN', name: 'Telugu (India)' },
  { code: 'th-TH', name: 'Thai (Thailand)' },
  { code: 'tn-ZA', name: 'Tswana (South Africa)' },
  { code: 'tr-TR', name: 'Turkish (Turkey)' },
  { code: 'uk-UA', name: 'Ukrainian (Ukraine)' },
  { code: 'uz-UZ', name: 'Uzbek (Uzbekistan)' },
  { code: 'vi-VN', name: 'Vietnamese (Vietnam)' },
  { code: 'cy-GB', name: 'Welsh (United Kingdom)' },
  { code: 'xh-ZA', name: 'Xhosa (South Africa)' },
  { code: 'zu-ZA', name: 'Zulu (South Africa)' },
];

const asCommand = (component: ComponentItem): ActionItem => {
  const href = asComponentHref(component.name);
  return {
    icon: component.icon,
    iconClass: '',
    title: component.name,
    description: `View the ${component.name} component`,
    onAction: () => goto(href),
    text: href,
  };
};

export const getDocsProviders = () => {
  const commands: ActionItem[] = [];
  for (const component of components) {
    commands.push(asCommand(component), ...(component.items ?? []).map((item) => asCommand(item)));
  }

  return [
    defaultProvider({
      name: 'Pages',
      types: ['page', 'pages'],
      actions: linkCommands([
        {
          title: 'Getting started',
          description: 'Learn how to get started using @immich/ui in your project',
          href: '/getting-started',
        },
        { title: 'Introduction', description: 'A Svelte component library for Immich', href: '/introduction' },
        { title: 'Components', description: 'List of components', href: '/components' },
      ]),
    }),
    defaultProvider({ name: 'Components', types: ['component', 'components'], actions: commands }),
  ];
};
