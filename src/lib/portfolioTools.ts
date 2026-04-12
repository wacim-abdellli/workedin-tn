export const LEGACY_PORTFOLIO_TOOL_PREFIX = '__tool__:';

export function normalizePortfolioTextArray(values: readonly unknown[] | null | undefined): string[] {
    if (!Array.isArray(values)) {
        return [];
    }

    const result: string[] = [];
    const seen = new Set<string>();

    values.forEach((value) => {
        if (typeof value !== 'string') {
            return;
        }

        const normalized = value.trim();
        if (!normalized) {
            return;
        }

        const key = normalized.toLowerCase();
        if (seen.has(key)) {
            return;
        }

        seen.add(key);
        result.push(normalized);
    });

    return result;
}

function isLegacyToolEntry(value: string): boolean {
    return value.toLowerCase().startsWith(LEGACY_PORTFOLIO_TOOL_PREFIX);
}

function decodeLegacyToolEntry(value: string): string {
    return value.slice(LEGACY_PORTFOLIO_TOOL_PREFIX.length).trim();
}

export function splitPortfolioSkillsAndTools(
    skillsUsed: readonly unknown[] | null | undefined,
    toolsUsed: readonly unknown[] | null | undefined,
): {
    skills: string[];
    tools: string[];
} {
    const normalizedSkills = normalizePortfolioTextArray(skillsUsed);
    const normalizedTools = normalizePortfolioTextArray(toolsUsed);

    const extractedTools: string[] = [];
    const cleanSkills: string[] = [];

    normalizedSkills.forEach((entry) => {
        if (isLegacyToolEntry(entry)) {
            const decodedTool = decodeLegacyToolEntry(entry);
            if (decodedTool) {
                extractedTools.push(decodedTool);
            }
            return;
        }

        cleanSkills.push(entry);
    });

    return {
        skills: cleanSkills,
        tools: normalizePortfolioTextArray([...normalizedTools, ...extractedTools]),
    };
}

export function composePortfolioSkillsFallback(
    skills: readonly unknown[] | null | undefined,
    tools: readonly unknown[] | null | undefined,
): string[] {
    const cleanSkills = normalizePortfolioTextArray(skills).filter((entry) => !isLegacyToolEntry(entry));
    const encodedTools = normalizePortfolioTextArray(tools).map((tool) => `${LEGACY_PORTFOLIO_TOOL_PREFIX}${tool}`);

    return normalizePortfolioTextArray([...cleanSkills, ...encodedTools]);
}
